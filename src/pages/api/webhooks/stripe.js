import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendFreeBottleReward, sendOrderConfirmation } from '@/lib/mailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function generateFreeBottleCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `OTGJFREE${rand}`;
}

// Disable Next.js body parsing — Stripe needs the raw buffer to verify the signature
export const config = { api: { bodyParser: false } };

async function readRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await readRawBody(req);
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ── Payment Intent (Stripe Elements flow) ────────────────────────
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const meta = pi.metadata || {};
    const ship = pi.shipping;

    console.log(`✅ [webhook] payment_intent.succeeded — ${pi.id} — £${(pi.amount / 100).toFixed(2)}`);

    let items = [];
    try { items = JSON.parse(meta.items || '[]'); } catch {}

    const shippingAddress = ship?.address
      ? [ship.address.line1, ship.address.line2, ship.address.city, ship.address.postal_code]
          .filter(Boolean).join(', ')
      : '';

    const { error } = await supabaseAdmin.from('orders').insert({
      customer_name: meta.customer_name || ship?.name || '',
      customer_email: meta.customer_email || '',
      customer_phone: meta.customer_phone || ship?.phone || '',
      delivery_method: meta.delivery_method || 'pickup',
      shipping_address: shippingAddress,
      postcode: meta.postcode || ship?.address?.postal_code || '',
      items,
      total_amount: pi.amount / 100,
      payment_status: 'paid',
      fulfillment_status: 'processing',
      stripe_session_id: pi.id,
    });

    if (error) console.error('[webhook] Supabase insert error:', error.message);

    // Send order confirmation email
    if (meta.customer_email) {
      try {
        await sendOrderConfirmation(meta.customer_email, {
          name: meta.customer_name || '',
          orderId: pi.id,
          items,
          deliveryMethod: meta.delivery_method || 'pickup',
          shippingAddress: shippingAddress,
          totalPence: pi.amount,
          discountPence: parseInt(meta.discount_pence || '0', 10),
        });
      } catch (e) {
        console.error('[webhook] Failed to send order confirmation:', e.message);
      }
    }

    // Mark discount code as used
    const discountCode = meta.discount_code;
    if (discountCode) {
      const { error: dcErr } = await supabaseAdmin
        .from('discount_codes')
        .update({ used: true, used_at: new Date().toISOString(), used_by_order: pi.id })
        .eq('code', discountCode)
        .eq('used', false);
      if (dcErr) console.error('[webhook] Failed to mark discount code used:', dcErr.message);
    }

    // Bottle reward tracking (7 bottles → 1 free)
    const customerEmail = meta.customer_email;
    if (customerEmail) {
      const bottlesOrdered = items.reduce((s, i) => s + (i.q || i.qty || 0), 0);
      if (bottlesOrdered > 0) {
        const { data: existing } = await supabaseAdmin
          .from('customer_rewards')
          .select('bottles_purchased, rewards_sent')
          .eq('email', customerEmail)
          .maybeSingle();

        const prevBottles = existing?.bottles_purchased || 0;
        const prevRewards = existing?.rewards_sent || 0;
        const newBottles = prevBottles + bottlesOrdered;
        const newRewardCount = Math.floor(newBottles / 7);

        await supabaseAdmin.from('customer_rewards').upsert(
          { email: customerEmail, bottles_purchased: newBottles, rewards_sent: newRewardCount, updated_at: new Date().toISOString() },
          { onConflict: 'email' }
        );

        // Send a free bottle code for each newly earned reward
        for (let r = prevRewards + 1; r <= newRewardCount; r++) {
          const code = generateFreeBottleCode();
          const { error: codeErr } = await supabaseAdmin.from('discount_codes').insert({
            code,
            email: customerEmail,
            type: 'free_bottle',
            discount_fixed_pence: 199,
            min_order_pence: 0,
          });
          if (!codeErr) {
            sendFreeBottleReward(customerEmail, code).catch(e =>
              console.error('[webhook] Failed to send free bottle email:', e.message)
            );
          }
        }
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object;
    console.log(`❌ [webhook] payment_intent.payment_failed — ${pi.id} — ${pi.last_payment_error?.message}`);
  }

  // ── Stripe Checkout Session (legacy flow, kept for safety) ────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    let lineItems = [];
    try {
      const expanded = await stripe.checkout.sessions.listLineItems(
        session.id,
        { limit: 50, expand: ['data.price.product'] }
      );
      lineItems = expanded.data.map(li => ({
        name: li.description || li.price?.product?.name || 'Item',
        qty: li.quantity,
        price: (li.price?.unit_amount ?? 0) / 100,
      }));
    } catch {
      try {
        lineItems = JSON.parse(session.metadata?.items || '[]').map(i => ({ name: i.n, qty: i.q, price: i.p }));
      } catch {}
    }

    const meta = session.metadata || {};
    const shipping = session.shipping_details;

    const { error } = await supabaseAdmin.from('orders').insert({
      customer_name: session.customer_details?.name || '',
      customer_email: session.customer_details?.email || '',
      customer_phone: session.customer_details?.phone || meta.customer_phone || '',
      delivery_method: meta.delivery_method || 'pickup',
      shipping_address: shipping
        ? [shipping.address?.line1, shipping.address?.line2, shipping.address?.city, shipping.address?.postal_code]
            .filter(Boolean).join(', ')
        : meta.shipping_address || '',
      postcode: shipping?.address?.postal_code || '',
      items: lineItems,
      total_amount: (session.amount_total ?? 0) / 100,
      payment_status: 'paid',
      fulfillment_status: 'processing',
      stripe_session_id: session.id,
    });

    if (error) console.error('[webhook] Supabase insert error (session):', error.message);
  }

  return res.status(200).json({ received: true });
}
