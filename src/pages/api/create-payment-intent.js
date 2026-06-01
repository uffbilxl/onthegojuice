import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { applyBundles } from '@/lib/bundleCalculator';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Authoritative server-side prices in pence — never trust client-sent prices
const PRODUCT_PRICES = {
  1: 199, 2: 199, 3: 199, 4: 199, 5: 199, 6: 199,
  7: 199, 8: 199, 9: 150, 10: 199, 11: 199, 12: 199,
  13: 199, 14: 199, 15: 199, 16: 199, 17: 150, 18: 150, 19: 199,
};

const DELIVERY_FEE             = 150;  // £1.50
const FREE_DELIVERY_THRESHOLD  = 1000; // £10.00

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { items, deliveryMethod, customer, address, discountCode } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // ── 1. Validate items & compute standard subtotal ──────────────────
  let standardSubtotal = 0;
  let totalQty         = 0;

  for (const item of items) {
    const unitPrice = PRODUCT_PRICES[item.id];
    if (!unitPrice)                                        return res.status(400).json({ error: `Unknown product id: ${item.id}` });
    if (!Number.isInteger(item.qty) || item.qty < 1)      return res.status(400).json({ error: 'Invalid quantity' });
    standardSubtotal += unitPrice * item.qty;
    totalQty         += item.qty;
  }

  // ── 2. Fetch active bundles from Supabase (server-authoritative) ───
  const { data: activeBundles } = await supabaseAdmin
    .from('promotions_config')
    .select('id, name, badge_text, min_qty, total_price_pence')
    .eq('is_active', true)
    .order('min_qty', { ascending: false });

  // ── 3. Cascading bundle math ───────────────────────────────────────
  //  avgSinglePrice keeps the "per bottle" remainder pricing proportional
  //  to the actual mixed cart (shots at 150p, bottles at 199p)
  const avgSinglePrice = Math.round(standardSubtotal / totalQty);
  const bundleResult   = applyBundles(totalQty, activeBundles ?? [], avgSinglePrice);

  const subtotal      = bundleResult.totalPence;
  const savingsPence  = standardSubtotal - subtotal;
  const bundlesActive = bundleResult.hasBundles && activeBundles?.length > 0;

  // ── 4. Delivery fee ────────────────────────────────────────────────
  const isDelivery  = deliveryMethod === 'local_delivery';
  const deliveryFee = isDelivery && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;

  // ── 5. Discount code (only honoured when no bundle improved the price) ──
  let discountPence = 0;
  let validatedCode = null;

  if (discountCode && !bundlesActive) {
    const { data: dc } = await supabaseAdmin
      .from('discount_codes')
      .select('*')
      .eq('code', discountCode.toUpperCase().trim())
      .eq('used', false)
      .maybeSingle();

    if (dc && subtotal >= dc.min_order_pence) {
      discountPence = dc.discount_percent
        ? Math.round(subtotal * dc.discount_percent / 100)
        : Math.min(dc.discount_fixed_pence ?? 0, subtotal);
      validatedCode = dc.code;
    }
  }

  const totalAmount = Math.max(50, subtotal + deliveryFee - discountPence);

  // ── 6. Build Stripe metadata ───────────────────────────────────────
  const itemsMeta = JSON.stringify(
    items.map(i => ({ id: i.id, n: (i.name || '').slice(0, 25), q: i.qty, p: PRODUCT_PRICES[i.id] }))
  ).slice(0, 490);

  const bundleMeta = bundlesActive
    ? bundleResult.breakdown.map(b => `${b.packs}×${b.label}`).join(', ')
    : '';

  const params = {
    amount:   totalAmount,
    currency: 'gbp',
    metadata: {
      delivery_method:   isDelivery ? 'local_delivery' : 'pickup',
      customer_name:     (customer?.name  || '').slice(0, 200),
      customer_email:    (customer?.email || '').slice(0, 200),
      customer_phone:    (customer?.phone || '').slice(0, 100),
      postcode:          (address?.postcode || '').slice(0, 20),
      items:             itemsMeta,
      discount_code:     validatedCode || '',
      discount_pence:    String(discountPence),
      bundle_applied:    bundleMeta.slice(0, 200),
      standard_pence:    String(standardSubtotal),
      savings_pence:     String(Math.max(0, savingsPence)),
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
      clientSecret:   intent.client_secret,
      discountPence,
      validatedCode,
      bundleResult:   bundlesActive ? bundleResult : null,
      standardPence:  standardSubtotal,
      savingsPence:   Math.max(0, savingsPence),
      totalPence:     totalAmount,
    });
  } catch (err) {
    console.error('[create-payment-intent]', err);
    return res.status(500).json({ error: 'Payment initialization failed. Please try again.' });
  }
}
