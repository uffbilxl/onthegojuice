import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Authoritative server-side prices in pence — never trust client-sent prices
const PRODUCT_PRICES = {
  1: 199, 2: 199, 3: 199, 4: 199, 5: 199, 6: 199,
  7: 199, 8: 199, 9: 150, 10: 199, 11: 199, 12: 199,
  13: 199, 14: 199, 15: 199, 16: 199,
  17: 150, 18: 150, 19: 199,
};

const DELIVERY_FEE = 150;             // £1.50
const FREE_DELIVERY_THRESHOLD = 1000; // £10.00

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { items, deliveryMethod, customer, address, discountCode } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // ── Calculate individual subtotal server-side ──────────────────
  let subtotal = 0;
  let totalQty = 0;
  for (const item of items) {
    const unitPrice = PRODUCT_PRICES[item.id];
    if (!unitPrice) return res.status(400).json({ error: `Unknown product id: ${item.id}` });
    if (!Number.isInteger(item.qty) || item.qty < 1) return res.status(400).json({ error: 'Invalid quantity' });
    subtotal  += unitPrice * item.qty;
    totalQty  += item.qty;
  }

  // ── Server-side bundle validation ──────────────────────────────
  // Fetch active promotions sorted highest threshold first so we apply the best deal
  let bundleDiscountPence = 0;
  let appliedBundle = null;
  const { data: activePromos } = await supabaseAdmin
    .from('promotions_config')
    .select('id, name, min_qty, total_price_pence')
    .eq('is_active', true)
    .order('min_qty', { ascending: false });

  if (activePromos?.length) {
    for (const promo of activePromos) {
      if (totalQty >= promo.min_qty && promo.total_price_pence < subtotal) {
        bundleDiscountPence = subtotal - promo.total_price_pence;
        appliedBundle = promo;
        break;
      }
    }
  }

  const isDelivery = deliveryMethod === 'local_delivery';
  const deliveryFee = isDelivery && (subtotal - bundleDiscountPence) < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;

  // ── Server-side discount code validation (skipped if bundle applied) ──
  let discountPence = bundleDiscountPence;
  let validatedCode = null;

  if (!appliedBundle && discountCode) {
    const { data: dc } = await supabaseAdmin
      .from('discount_codes')
      .select('*')
      .eq('code', discountCode.toUpperCase().trim())
      .eq('used', false)
      .maybeSingle();
    if (dc && subtotal >= dc.min_order_pence) {
      if (dc.discount_percent) {
        discountPence = Math.round(subtotal * dc.discount_percent / 100);
      } else if (dc.discount_fixed_pence) {
        discountPence = Math.min(dc.discount_fixed_pence, subtotal);
      }
      validatedCode = dc.code;
    }
  }

  const totalAmount = Math.max(50, subtotal + deliveryFee - discountPence);

  // Compact items for metadata (Stripe: 500 char limit per value)
  const itemsMeta = JSON.stringify(
    items.map(i => ({ id: i.id, n: (i.name || '').slice(0, 25), q: i.qty, p: PRODUCT_PRICES[i.id] }))
  ).slice(0, 490);

  const params = {
    amount: totalAmount,
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
      bundle_id:         appliedBundle?.id || '',
      bundle_name:       appliedBundle?.name || '',
    },
  };

  if (isDelivery && address?.line1) {
    params.shipping = {
      name: customer?.name || 'Customer',
      phone: customer?.phone || undefined,
      address: {
        line1:       address.line1 || '',
        line2:       address.line2 || '',
        city:        address.city  || 'Birmingham',
        postal_code: address.postcode || '',
        country:     'GB',
      },
    };
  }

  try {
    const intent = await stripe.paymentIntents.create(params);
    return res.status(200).json({
      clientSecret:    intent.client_secret,
      discountPence,
      validatedCode,
      appliedBundle:   appliedBundle ? { id: appliedBundle.id, name: appliedBundle.name } : null,
      totalPence:      totalAmount,
    });
  } catch (err) {
    console.error('[create-payment-intent]', err);
    return res.status(500).json({ error: 'Payment initialization failed. Please try again.' });
  }
}
