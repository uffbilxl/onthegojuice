import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // ── Auth & role gate ─────────────────────────────────────────────
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Invalid session' });

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, company_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'corporate') {
    return res.status(403).json({ error: 'Corporate account required' });
  }

  // ── Validate body ────────────────────────────────────────────────
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items in order' });
  }

  // ── Fetch authoritative wholesale prices from DB ─────────────────
  const productIds = items.map(i => Number(i.id));
  const { data: products, error: prodErr } = await supabaseAdmin
    .from('products')
    .select('id, name, price_pence, wholesale_price_pence')
    .in('id', productIds)
    .eq('active', true);

  if (prodErr || !products?.length) {
    console.error('[corporate/checkout-session] products fetch error', prodErr?.message);
    return res.status(500).json({ error: 'Could not load product pricing' });
  }

  const priceMap = {};
  products.forEach(p => {
    priceMap[p.id] = {
      name:       p.name,
      unitAmount: p.wholesale_price_pence ?? Math.round(p.price_pence * 0.70),
    };
  });

  // ── Build Stripe line items (server-side prices only) ────────────
  const lineItems = [];
  let totalBottles = 0;

  for (const item of items) {
    const id  = Number(item.id);
    const qty = Math.max(1, Math.min(10_000, parseInt(item.qty) || 0));
    if (qty === 0) continue;

    const product = priceMap[id];
    if (!product) continue;

    lineItems.push({
      price_data: {
        currency:     'gbp',
        product_data: {
          name:        `${product.name} (Wholesale)`,
          description: `Wholesale pricing — ${profile.company_name || user.email}`,
        },
        unit_amount: product.unitAmount,
      },
      quantity: qty,
    });
    totalBottles += qty;
  }

  if (lineItems.length === 0) {
    return res.status(400).json({ error: 'No valid items to process' });
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://onthegojuice.vercel.app';

  try {
    const session = await stripe.checkout.sessions.create({
      mode:          'payment',
      line_items:    lineItems,
      customer_email: user.email,

      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ['GB'] },

      allow_promotion_codes: false, // wholesale pricing already applied

      success_url: `${base}/thank-you?session_id={CHECKOUT_SESSION_ID}&type=corporate`,
      cancel_url:  `${base}/corporate/dashboard`,

      metadata: {
        type:         'corporate_order',
        corporate_id: user.id,
        company:      (profile.company_name || '').slice(0, 200),
        total_bottles: String(totalBottles),
        pricing_tier: 'wholesale',
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[corporate/checkout-session] Stripe error:', err.message, err.code ?? '');
    const msg = err.type === 'StripeInvalidRequestError'
      ? `Payment setup failed: ${err.message}`
      : 'Failed to create checkout session. Please try again.';
    return res.status(500).json({ error: msg });
  }
}
