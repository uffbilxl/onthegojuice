import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendFreeBottleReward, sendOrderConfirmation } from '@/lib/mailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 1 point = 1p discount · 10 points per £1 spent
const POINTS_PER_10P = 1;

// FREE_BOTTLE_PENCE: covers the most expensive bottle tier (Creamy Nutrition £4.99)
const FREE_BOTTLE_PENCE = 499;

function generateCode(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return prefix + Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export const config = { api: { bodyParser: false } };

async function readRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// ── Create a Stripe free-bottle promo code and persist it ────────────
async function issueFreeBottleReward(userId, userEmail) {
  const codeStr = generateCode('FREE');

  try {
    const coupon = await stripe.coupons.create({
      amount_off: FREE_BOTTLE_PENCE,
      currency:   'gbp',
      duration:   'once',
      name:       'OTGJ Free Bottle',
      metadata:   { user_id: userId, email: userEmail, type: 'free_bottle' },
    });

    const stripePromo = await stripe.promotionCodes.create({
      coupon:          coupon.id,
      code:            codeStr,
      max_redemptions: 1,
      metadata:        { user_id: userId, email: userEmail },
    });

    // user_rewards — visible on the account dashboard
    await supabaseAdmin.from('user_rewards').insert({
      user_id:          userId,
      email:            userEmail,
      type:             'free_bottle',
      promo_code:       codeStr,
      stripe_coupon_id: coupon.id,
      stripe_promo_id:  stripePromo.id,
    });

    // discount_codes — validated by checkout server
    await supabaseAdmin.from('discount_codes').insert({
      code:                 codeStr,
      email:                userEmail,
      type:                 'free_bottle',
      discount_fixed_pence: FREE_BOTTLE_PENCE,
      min_order_pence:      0,
    });

    sendFreeBottleReward(userEmail, codeStr).catch(e =>
      console.error('[webhook] Free bottle email failed:', e.message)
    );
  } catch (err) {
    console.error('[webhook] issueFreeBottleReward failed:', err.message);
  }
}

// ── Fallback for guest orders (no auth account) ───────────────────────
async function issueGuestFreeBottleReward(email) {
  const code = generateCode('FREE');
  const { error } = await supabaseAdmin.from('discount_codes').insert({
    code,
    email,
    type:                 'free_bottle',
    discount_fixed_pence: FREE_BOTTLE_PENCE,
    min_order_pence:      0,
  });
  if (!error) {
    sendFreeBottleReward(email, code).catch(e =>
      console.error('[webhook] Guest free bottle email failed:', e.message)
    );
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody   = await readRawBody(req);
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ── payment_intent.succeeded (Stripe Elements flow) ──────────────
  if (event.type === 'payment_intent.succeeded') {
    const pi   = event.data.object;
    const meta = pi.metadata || {};
    const ship = pi.shipping;

    console.log(`✅ [webhook] ${pi.id} — £${(pi.amount / 100).toFixed(2)}`);

    let items = [];
    try { items = JSON.parse(meta.items || '[]'); } catch {}

    const shippingAddress = ship?.address
      ? [ship.address.line1, ship.address.line2, ship.address.city, ship.address.postal_code]
          .filter(Boolean).join(', ')
      : '';

    // ── Save order ────────────────────────────────────────────────
    const { error: orderErr } = await supabaseAdmin.from('orders').insert({
      customer_name:      meta.customer_name || ship?.name || '',
      customer_email:     meta.customer_email || '',
      customer_phone:     meta.customer_phone || ship?.phone || '',
      delivery_method:    meta.delivery_method || 'pickup',
      shipping_address:   shippingAddress,
      postcode:           meta.postcode || ship?.address?.postal_code || '',
      items,
      total_amount:       pi.amount / 100,
      payment_status:     'paid',
      fulfillment_status: 'processing',
      stripe_session_id:  pi.id,
    });
    if (orderErr) console.error('[webhook] order insert:', orderErr.message);

    // ── Send confirmation email ───────────────────────────────────
    if (meta.customer_email) {
      sendOrderConfirmation(meta.customer_email, {
        name:            meta.customer_name || '',
        orderId:         pi.id,
        items,
        deliveryMethod:  meta.delivery_method || 'pickup',
        shippingAddress,
        totalPence:      pi.amount,
        discountPence:   parseInt(meta.discount_pence || '0', 10),
      }).catch(e => console.error('[webhook] order confirmation email:', e.message));
    }

    // ── Mark discount code + user_reward used ────────────────────
    if (meta.discount_code) {
      await Promise.all([
        supabaseAdmin
          .from('discount_codes')
          .update({ used: true, used_at: new Date().toISOString(), used_by_order: pi.id })
          .eq('code', meta.discount_code)
          .eq('used', false),
        supabaseAdmin
          .from('user_rewards')
          .update({ redeemed: true })
          .eq('promo_code', meta.discount_code)
          .eq('redeemed', false),
      ]);
    }

    const customerEmail = meta.customer_email;

    // ── Bottle tracking ───────────────────────────────────────────
    if (customerEmail) {
      const bottlesOrdered = items.reduce((s, i) => s + (i.q || i.qty || 0), 0);

      if (bottlesOrdered > 0) {
        // Look up by email — works for both auth and guest orders
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, bottle_progress, lifetime_bottles_bought')
          .eq('email', customerEmail)
          .maybeSingle();

        if (profile) {
          // ── Auth user path ──────────────────────────────────────
          let progress = profile.bottle_progress + bottlesOrdered;
          let newRewards = 0;
          while (progress >= 7) { progress -= 7; newRewards++; }

          await supabaseAdmin
            .from('profiles')
            .update({
              bottle_progress:         progress,
              lifetime_bottles_bought: (profile.lifetime_bottles_bought || 0) + bottlesOrdered,
            })
            .eq('id', profile.id);

          for (let i = 0; i < newRewards; i++) {
            await issueFreeBottleReward(profile.id, customerEmail);
          }

        } else {
          // ── Guest order path (no account) ─────────────────────
          const { data: existing } = await supabaseAdmin
            .from('customer_rewards')
            .select('bottles_purchased, rewards_sent')
            .eq('email', customerEmail)
            .maybeSingle();

          const prevBottles    = existing?.bottles_purchased || 0;
          const prevRewards    = existing?.rewards_sent || 0;
          const newBottles     = prevBottles + bottlesOrdered;
          const newRewardCount = Math.floor(newBottles / 7);

          await supabaseAdmin.from('customer_rewards').upsert(
            { email: customerEmail, bottles_purchased: newBottles, rewards_sent: newRewardCount, updated_at: new Date().toISOString() },
            { onConflict: 'email' }
          );

          for (let r = prevRewards + 1; r <= newRewardCount; r++) {
            await issueGuestFreeBottleReward(customerEmail);
          }
        }
      }
    }

    // ── Loyalty points ────────────────────────────────────────────
    if (customerEmail) {
      const pointsRedeemed = parseInt(meta.loyalty_points_redeemed || '0', 10);
      const pointsEarned   = Math.floor(pi.amount / 10) * POINTS_PER_10P;

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('loyalty_points')
        .eq('email', customerEmail)
        .maybeSingle();

      if (profile) {
        const newPoints = Math.max(0, (profile.loyalty_points || 0) - pointsRedeemed + pointsEarned);
        await supabaseAdmin
          .from('profiles')
          .update({ loyalty_points: newPoints })
          .eq('email', customerEmail);
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object;
    console.log(`❌ [webhook] ${pi.id} — ${pi.last_payment_error?.message}`);
  }

  // ── checkout.session.completed (subscription / legacy flow) ──────
  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object;
    const meta     = session.metadata || {};
    const shipping = session.shipping_details;

    let lineItems = [];
    try {
      const expanded = await stripe.checkout.sessions.listLineItems(
        session.id,
        { limit: 50, expand: ['data.price.product'] }
      );
      lineItems = expanded.data.map(li => ({
        name:  li.description || li.price?.product?.name || 'Item',
        qty:   li.quantity,
        price: (li.price?.unit_amount ?? 0) / 100,
      }));
    } catch {
      try {
        lineItems = JSON.parse(session.metadata?.items || '[]').map(i => ({ name: i.n, qty: i.q, price: i.p }));
      } catch {}
    }

    await supabaseAdmin.from('orders').insert({
      customer_name:      session.customer_details?.name || '',
      customer_email:     session.customer_details?.email || '',
      customer_phone:     session.customer_details?.phone || meta.customer_phone || '',
      delivery_method:    meta.delivery_method || 'pickup',
      shipping_address:   shipping
        ? [shipping.address?.line1, shipping.address?.line2, shipping.address?.city, shipping.address?.postal_code]
            .filter(Boolean).join(', ')
        : meta.shipping_address || '',
      postcode:           shipping?.address?.postal_code || '',
      items:              lineItems,
      total_amount:       (session.amount_total ?? 0) / 100,
      payment_status:     'paid',
      fulfillment_status: 'processing',
      stripe_session_id:  session.id,
    });
  }

  return res.status(200).json({ received: true });
}
