import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Creates a Stripe Checkout Session in "subscription" mode.
 *
 * Prerequisites (one-time Stripe Dashboard setup):
 *  1. Create a recurring Product in Stripe for each plan
 *  2. Create a Price for each interval (weekly / monthly) under that Product
 *  3. Set STRIPE_PRICE_WEEKLY and STRIPE_PRICE_MONTHLY in your .env.local / Vercel env vars
 *
 * Example env vars:
 *   STRIPE_PRICE_WEEKLY=price_xxx
 *   STRIPE_PRICE_MONTHLY=price_yyy
 *   NEXT_PUBLIC_BASE_URL=https://onthegojuice.vercel.app
 */

const INTERVAL_PRICE_MAP = {
  weekly:  process.env.STRIPE_PRICE_WEEKLY,
  monthly: process.env.STRIPE_PRICE_MONTHLY,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { interval, quantity, email } = req.body;

  if (!interval || !INTERVAL_PRICE_MAP[interval]) {
    return res.status(400).json({ error: 'interval must be "weekly" or "monthly"' });
  }

  const priceId = INTERVAL_PRICE_MAP[interval];
  if (!priceId) {
    return res.status(500).json({
      error: `STRIPE_PRICE_${interval.toUpperCase()} env var is not set. Create the price in the Stripe Dashboard and add it to your environment variables.`,
    });
  }

  const qty = Math.max(1, Math.min(20, parseInt(quantity) || 1));
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://onthegojuice.vercel.app';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: qty }],
      ...(email ? { customer_email: email } : {}),
      success_url: `${base}/thank-you?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
      cancel_url:  `${base}/#products`,
      metadata: { interval, quantity: String(qty) },
      subscription_data: {
        metadata: { interval, quantity: String(qty) },
      },
      allow_promotion_codes: true,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[create-subscription-session]', err.message);
    return res.status(500).json({ error: 'Failed to create subscription. Please try again.' });
  }
}
