import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { applyBundles } from '@/lib/bundleCalculator';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const DELIVERY_FEE            = 150;   // £1.50 pence
const FREE_DELIVERY_THRESHOLD = 1000;  // £10.00 pence
const STUDENT_DISCOUNT_RATE   = 0.20;  // 20%

// In-process price cache — refreshed every 60 s to avoid a DB hit per request
let priceCache     = null;
let priceCachedAt  = 0;
const PRICE_TTL    = 60_000;

async function getProductPrices() {
  if (priceCache && Date.now() - priceCachedAt < PRICE_TTL) return priceCache;

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, price_pence')
    .eq('active', true);

  if (error || !data?.length) throw new Error('Product catalogue unavailable');

  priceCache    = Object.fromEntries(data.map(p => [p.id, p.price_pence]));
  priceCachedAt = Date.now();
  return priceCache;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { items, deliveryMethod, customer, address, discountCode, redeemPoints } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // ── Validate contact information ───────────────────────────────────
  const name  = customer?.name?.trim()  || '';
  const email = customer?.email?.trim() || '';
  const phone = customer?.phone?.trim() || '';
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone number are required.' });
  }
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number format.' });
  }

  // ── 1. Fetch server-authoritative product prices from DB ───────────
  let PRODUCT_PRICES;
  try {
    PRODUCT_PRICES = await getProductPrices();
  } catch {
    return res.status(500).json({ error: 'Product catalogue unavailable. Please try again.' });
  }

  // ── 2. Validate items & compute standard subtotal ──────────────────
  let standardSubtotal = 0;
  let totalQty         = 0;

  for (const item of items) {
    const unitPrice = PRODUCT_PRICES[item.id];
    if (!unitPrice)                                   return res.status(400).json({ error: `Unknown product id: ${item.id}` });
    if (!Number.isInteger(item.qty) || item.qty < 1) return res.status(400).json({ error: 'Invalid quantity' });
    standardSubtotal += unitPrice * item.qty;
    totalQty         += item.qty;
  }

  // ── 3. Fetch active bundles & apply cascading math ─────────────────
  const { data: activeBundles } = await supabaseAdmin
    .from('promotions_config')
    .select('id, name, badge_text, min_qty, total_price_pence')
    .eq('is_active', true)
    .order('min_qty', { ascending: false });

  const avgSinglePrice = Math.round(standardSubtotal / totalQty);
  const bundleResult   = applyBundles(totalQty, activeBundles ?? [], avgSinglePrice);

  const subtotal      = bundleResult.totalPence;
  const savingsPence  = standardSubtotal - subtotal;
  const bundlesActive = bundleResult.hasBundles && (activeBundles?.length ?? 0) > 0;

  // ── 4. Delivery fee ────────────────────────────────────────────────
  const isDelivery  = deliveryMethod === 'local_delivery';
  const deliveryFee = isDelivery && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;

  // ── 5. Promo/discount code (only when bundles aren't active) ───────
  let discountPence = 0;
  let validatedCode = null;

  if (discountCode && !bundlesActive) {
    let { data: dc } = await supabaseAdmin
      .from('discount_codes')
      .select('*')
      .eq('code', discountCode.toUpperCase().trim())
      .eq('used', false)
      .maybeSingle();

    if (dc && subtotal >= dc.min_order_pence) {
      // Hard lock: check used_discounts ledger (covers guests + logged-in users)
      if (email) {
        const { data: alreadyUsed } = await supabaseAdmin
          .from('used_discounts')
          .select('id')
          .eq('email', email.toLowerCase())
          .eq('discount_code', dc.code.toUpperCase())
          .maybeSingle();
        if (alreadyUsed) dc = null;
      }

      // Soft lock for welcome codes: also check profile flag (belt-and-suspenders)
      if (dc && dc.type === 'welcome' && email) {
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('welcome_discount_claimed')
          .eq('email', email.toLowerCase())
          .maybeSingle();
        if (prof?.welcome_discount_claimed) dc = null;
      }

      if (dc) {
        discountPence = dc.discount_percent
          ? Math.round(subtotal * dc.discount_percent / 100)
          : Math.min(dc.discount_fixed_pence ?? 0, subtotal);
        validatedCode = dc.code;

        // Pre-emptively lock the code at payment-creation time so it cannot be
        // reused even if the webhook is delayed or misfires.
        if (dc.type === 'welcome' && dc.email) {
          supabaseAdmin
            .from('profiles')
            .update({ welcome_discount_claimed: true })
            .eq('email', dc.email.toLowerCase())
            .then(() => {});

          supabaseAdmin
            .from('used_discounts')
            .insert({ email: dc.email.toLowerCase(), discount_code: dc.code })
            .then(() => {});
        }
      }
    }
  }

  // Running total before student/loyalty adjustments
  let runningTotal = subtotal + deliveryFee - discountPence;

  // ── 6. Student discount — server-side .ac.uk check ────────────────
  const isStudent  = email.toLowerCase().endsWith('.ac.uk');
  const studentDiscountPence = isStudent ? Math.round(runningTotal * STUDENT_DISCOUNT_RATE) : 0;

  runningTotal -= studentDiscountPence;

  // ── 7. Loyalty points redemption ──────────────────────────────────
  //   1 point = 1 pence of discount. Points are capped at order value minus 50p minimum.
  let loyaltyDiscountPence = 0;
  let pointsRedeemed       = 0;

  if (redeemPoints && email) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('loyalty_points')
      .eq('email', email)
      .maybeSingle();

    if (profile?.loyalty_points > 0) {
      const maxRedeem = Math.max(0, Math.min(profile.loyalty_points, runningTotal - 50));
      loyaltyDiscountPence = maxRedeem;
      pointsRedeemed       = maxRedeem;
    }
  }

  const totalAmount = Math.max(50, runningTotal - loyaltyDiscountPence);

  // ── 8. Build Stripe Payment Intent ────────────────────────────────
  const itemsMeta  = JSON.stringify(
    items.map(i => ({ id: i.id, n: (i.name || '').slice(0, 25), q: i.qty, p: PRODUCT_PRICES[i.id] }))
  ).slice(0, 490);

  const bundleMeta = bundlesActive
    ? bundleResult.breakdown.map(b => `${b.packs}×${b.label}`).join(', ')
    : '';

  const params = {
    amount:   totalAmount,
    currency: 'gbp',
    metadata: {
      delivery_method:          isDelivery ? 'local_delivery' : 'pickup',
      customer_name:            (customer?.name  || '').slice(0, 200),
      customer_email:           (customer?.email || '').slice(0, 200),
      customer_phone:           (customer?.phone || '').slice(0, 100),
      postcode:                 (address?.postcode || '').slice(0, 20),
      items:                    itemsMeta,
      discount_code:            validatedCode || '',
      discount_pence:           String(discountPence),
      bundle_applied:           bundleMeta.slice(0, 200),
      standard_pence:           String(standardSubtotal),
      savings_pence:            String(Math.max(0, savingsPence)),
      student_discount_pence:   String(studentDiscountPence),
      loyalty_points_redeemed:  String(pointsRedeemed),
    },
  };

  if (isDelivery && address?.line1) {
    params.shipping = {
      name:  customer?.name || 'Customer',
      phone: customer?.phone || undefined,
      address: {
        line1:       address.line1    || '',
        line2:       address.line2    || '',
        city:        address.city     || 'Birmingham',
        postal_code: address.postcode || '',
        country:     'GB',
      },
    };
  }

  try {
    const intent = await stripe.paymentIntents.create(params);
    return res.status(200).json({
      clientSecret:          intent.client_secret,
      discountPence,
      validatedCode,
      bundleResult:          bundlesActive ? bundleResult : null,
      standardPence:         standardSubtotal,
      savingsPence:          Math.max(0, savingsPence),
      studentDiscountPence,
      loyaltyDiscountPence,
      isStudent,
      totalPence:            totalAmount,
    });
  } catch (err) {
    console.error('[create-payment-intent]', err);
    return res.status(500).json({ error: 'Payment initialization failed. Please try again.' });
  }
}
