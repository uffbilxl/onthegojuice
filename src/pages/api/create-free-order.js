import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { applyBundles } from '@/lib/bundleCalculator';
import { sendOrderConfirmation } from '@/lib/mailer';

let priceCache    = null;
let priceCachedAt = 0;
const PRICE_TTL   = 60_000;

async function getProductPrices() {
  if (priceCache && Date.now() - priceCachedAt < PRICE_TTL) return priceCache;
  const { data, error } = await supabaseAdmin
    .from('products').select('id, price_pence').eq('active', true);
  if (error || !data?.length) throw new Error('Product catalogue unavailable');
  priceCache    = Object.fromEntries(data.map(p => [p.id, p.price_pence]));
  priceCachedAt = Date.now();
  return priceCache;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { items, customer, address, deliveryMethod, discountCode } = req.body;

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const name  = customer?.name?.trim()  || '';
  const email = customer?.email?.trim() || '';
  const phone = customer?.phone?.trim() || '';
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required.' });
  }

  // ── Authoritative server-side pricing ─────────────────────────────
  let PRODUCT_PRICES;
  try { PRODUCT_PRICES = await getProductPrices(); } catch {
    return res.status(500).json({ error: 'Product catalogue unavailable.' });
  }

  let standardSubtotal = 0;
  let totalQty = 0;
  for (const item of items) {
    const unitPrice = PRODUCT_PRICES[item.id];
    if (!unitPrice || !Number.isInteger(item.qty) || item.qty < 1) {
      return res.status(400).json({ error: 'Invalid item in cart.' });
    }
    standardSubtotal += unitPrice * item.qty;
    totalQty         += item.qty;
  }

  const { data: activeBundles } = await supabaseAdmin
    .from('promotions_config')
    .select('id, name, badge_text, min_qty, total_price_pence')
    .eq('is_active', true)
    .order('min_qty', { ascending: false });

  const avgSingle   = Math.round(standardSubtotal / totalQty);
  const bundleResult = applyBundles(totalQty, activeBundles ?? [], avgSingle);
  const subtotal    = bundleResult.totalPence;

  const isDelivery  = deliveryMethod === 'local_delivery';
  const FREE_THRESHOLD = 1000;
  const deliveryFee = isDelivery && subtotal < FREE_THRESHOLD ? 150 : 0;

  // ── Validate discount code ─────────────────────────────────────────
  if (!discountCode) {
    return res.status(400).json({ error: 'A discount code is required for a free order.' });
  }

  let { data: dc } = await supabaseAdmin
    .from('discount_codes')
    .select('*')
    .eq('code', discountCode.toUpperCase().trim())
    .maybeSingle();

  if (!dc) return res.status(400).json({ error: 'Invalid discount code.' });
  if (dc.type !== 'promo' && dc.used) return res.status(400).json({ error: 'Discount code already used.' });

  if (subtotal < dc.min_order_pence) {
    return res.status(400).json({
      error: `Code requires a minimum spend of £${(dc.min_order_pence / 100).toFixed(2)}.`,
    });
  }

  const discountPence = dc.discount_percent
    ? Math.round((subtotal + deliveryFee) * dc.discount_percent / 100)
    : Math.min(dc.discount_fixed_pence ?? 0, subtotal + deliveryFee);

  const totalPence = Math.max(0, subtotal + deliveryFee - discountPence);

  if (totalPence !== 0) {
    return res.status(400).json({ error: 'This code does not make the order free.' });
  }

  // ── Record the order ───────────────────────────────────────────────
  const itemsMeta = items.map(i => ({
    id: i.id, n: (i.name || '').slice(0, 25), q: i.qty, p: PRODUCT_PRICES[i.id],
  }));

  const shippingAddress = isDelivery && address
    ? [address.line1, address.line2, address.city, address.postcode].filter(Boolean).join(', ')
    : '';

  const orderId = `free_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const { error: orderErr } = await supabaseAdmin.from('orders').insert({
    customer_name:      name,
    customer_email:     email,
    customer_phone:     phone,
    delivery_method:    deliveryMethod || 'pickup',
    shipping_address:   shippingAddress,
    postcode:           address?.postcode || '',
    items:              itemsMeta,
    total_amount:       0,
    payment_status:     'paid',
    fulfillment_status: 'processing',
    stripe_session_id:  orderId,
  });

  if (orderErr) {
    console.error('[create-free-order] order insert failed:', orderErr.message);
    return res.status(500).json({ error: 'Could not record order. Please try again.' });
  }

  // Mark single-use codes as used; promo codes stay active for reuse
  if (dc.type !== 'promo') {
    await supabaseAdmin
      .from('discount_codes')
      .update({ used: true, used_at: new Date().toISOString(), used_by_order: orderId })
      .eq('code', dc.code);
  }

  await sendOrderConfirmation(email, {
    name,
    orderId,
    items:          itemsMeta,
    deliveryMethod: deliveryMethod || 'pickup',
    shippingAddress,
    totalPence:     0,
    discountPence,
  }).catch(e => console.error('[create-free-order] confirmation email failed:', e.message));

  return res.status(200).json({ ok: true, orderId });
}
