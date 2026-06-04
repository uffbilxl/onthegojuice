import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { applyBundles } from '@/lib/bundleCalculator';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRODUCT_PRICES = {
  1: 199, 2: 199, 3: 199, 4: 199, 5: 199, 6: 199,
  7: 199, 8: 199, 9: 150, 10: 199, 11: 199, 12: 199,
  13: 199, 14: 199, 15: 199, 16: 199, 17: 150, 18: 150, 19: 199,
};

/**
 * POST /api/create-checkout-session
 *
 * Creates a Stripe Checkout Session in `subscription` mode.
 * Applies the same cascading bundle math as create-payment-intent.
 *
 * Body: { interval: 'week'|'month', quantity: number }
 *
 * The subscription price is built with inline price_data (no pre-created
 * Stripe Price objects needed) — bundle math determines the unit_amount.
 *
 * Each line item is one "delivery" of `quantity` bottles, priced after
 * the bundle algorithm has been applied to that quantity.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { interval, quantity, flavors } = req.body;
  const flavorsJson = Array.isArray(flavors) && flavors.length
    ? JSON.stringify(flavors).slice(0, 490)
    : '';

  if (!interval || !['week', 'month'].includes(interval)) {
    return res.status(400).json({ error: 'interval must be "week" or "month"' });
  }

  const qty = Math.max(1, Math.min(20, parseInt(quantity) || 1));

  // ── Fetch active bundles (same source as the payment intent) ──────
  const { data: activeBundles } = await supabaseAdmin
    .from('promotions_config')
    .select('id, name, badge_text, min_qty, total_price_pence')
    .eq('is_active', true)
    .order('min_qty', { ascending: false });

  // ── Cascading bundle math for the subscription quantity ───────────
  const singlePricePence = 199; // default per-bottle price for subscriptions
  const bundleResult = applyBundles(qty, activeBundles ?? [], singlePricePence);

  const totalUnitAmount = bundleResult.totalPence; // total in pence for this delivery

  // Build a human-readable description of the bundle breakdown
  const bundleDesc = bundleResult.hasBundles && activeBundles?.length
    ? bundleResult.breakdown.map(b => `${b.packs}× ${b.label}`).join(', ')
    : `${qty} bottle${qty > 1 ? 's' : ''}`;

  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://onthegojuice.vercel.app';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',

      line_items: [{
        price_data: {
          currency:     'gbp',
          product_data: {
            name:        'On The Go Juice — Fresh Delivery',
            description: bundleDesc,
            images:      ['https://onthegojuice.vercel.app/images/logo.png'],
          },
          // unit_amount is the TOTAL for the whole delivery (qty: 1 below)
          // so the customer sees one clear charge per period, not per bottle
          unit_amount: totalUnitAmount,
          recurring: {
            interval,       // 'week' or 'month'
            interval_count: 1,
          },
        },
        quantity: 1,
      }],

      allow_promotion_codes: true,

      success_url: `${base}/thank-you?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
      cancel_url:  `${base}/#subscribe-save`,

      metadata: {
        type:             'subscription',
        interval,
        quantity:         String(qty),
        bundle_applied:   bundleDesc.slice(0, 200),
        standard_pence:   String(qty * singlePricePence),
        total_pence:      String(totalUnitAmount),
        flavors_selected: flavorsJson,
      },

      subscription_data: {
        metadata: {
          interval,
          quantity:         String(qty),
          bundle_applied:   bundleDesc.slice(0, 200),
          flavors_selected: flavorsJson,
        },
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[create-checkout-session]', err.message);
    return res.status(500).json({ error: 'Failed to create subscription checkout. Please try again.' });
  }
}
