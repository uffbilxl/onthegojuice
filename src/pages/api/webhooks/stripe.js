import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendFreeBottleReward, sendOrderConfirmation } from '@/lib/mailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const POINTS_PER_10P = 1;
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

// ── Free bottle reward ────────────────────────────────────────────────
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
    await supabaseAdmin.from('user_rewards').insert({
      user_id:          userId,
      email:            userEmail,
      type:             'free_bottle',
      promo_code:       codeStr,
      stripe_coupon_id: coupon.id,
      stripe_promo_id:  stripePromo.id,
    });
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

// ── Shared: rewards + loyalty (called from both event handlers) ───────
async function handleRewardsAndLoyalty({ customerEmail, bottlesOrdered, amountPence, discountCode, orderId }) {
  if (!customerEmail) return;

  // Mark discount code used
  if (discountCode) {
    const { data: dc } = await supabaseAdmin
      .from('discount_codes')
      .select('type, email')
      .eq('code', discountCode)
      .maybeSingle();

    await Promise.all([
      // Only mark single-use codes as used; promo codes (type='promo') are multi-use
      dc?.type !== 'promo'
        ? supabaseAdmin
            .from('discount_codes')
            .update({ used: true, used_at: new Date().toISOString(), used_by_order: orderId })
            .eq('code', discountCode)
            .eq('used', false)
        : Promise.resolve(),
      supabaseAdmin
        .from('user_rewards')
        .update({ redeemed: true })
        .eq('promo_code', discountCode)
        .eq('redeemed', false),
    ]);

    // Record in used_discounts ledger — prevents any future reuse by this email
    supabaseAdmin
      .from('used_discounts')
      .insert({
        email:         customerEmail.toLowerCase(),
        discount_code: discountCode.toUpperCase(),
      })
      .then(({ error }) => {
        if (error && error.code !== '23505') { // 23505 = unique violation (already recorded)
          console.error('[webhook] used_discounts insert failed:', error.message);
        }
      });

    // If it was a welcome code, permanently flag the profile so it can't be reused
    if (dc?.type === 'welcome' && dc?.email) {
      await supabaseAdmin
        .from('profiles')
        .update({ welcome_discount_claimed: true })
        .eq('email', dc.email);
    }
  }

  // Bottle tracking
  if (bottlesOrdered > 0) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, bottle_progress, lifetime_bottles_bought')
      .eq('email', customerEmail)
      .maybeSingle();

    if (profile) {
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

  // Loyalty points
  const pointsEarned = Math.floor(amountPence / 10) * POINTS_PER_10P;
  if (pointsEarned > 0) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('loyalty_points')
      .eq('email', customerEmail)
      .maybeSingle();
    if (profile) {
      await supabaseAdmin
        .from('profiles')
        .update({ loyalty_points: Math.max(0, (profile.loyalty_points || 0) + pointsEarned) })
        .eq('email', customerEmail);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody   = await readRawBody(req);
  const signature = req.headers['stripe-signature'];

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).end();
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[webhook] Received: ${event.type} — ${event.id}`);

  // ── payment_intent.succeeded (Stripe Elements flow only) ─────────────
  // Stripe Checkout payments come through checkout.session.completed instead.
  // We detect Elements vs Checkout by checking for customer_email in PI metadata,
  // which is only set by the Elements flow.
  if (event.type === 'payment_intent.succeeded') {
    const pi   = event.data.object;
    const meta = pi.metadata || {};
    const ship = pi.shipping;

    // If customer_email is absent from PI metadata, this PI was created by a
    // Stripe Checkout Session. Skip here — checkout.session.completed handles it.
    if (!meta.customer_email) {
      console.log(`[webhook] PI ${pi.id} has no customer_email in metadata — skipping, handled by checkout.session.completed`);
      return res.status(200).json({ received: true });
    }

    console.log(`[webhook] payment_intent.succeeded — PI ${pi.id} — £${(pi.amount / 100).toFixed(2)} — ${meta.customer_email}`);

    let items = [];
    try { items = JSON.parse(meta.items || '[]'); } catch (e) {
      console.error(`[webhook] Failed to parse items metadata on PI ${pi.id}:`, e.message, '| raw:', meta.items);
    }

    const shippingAddress = ship?.address
      ? [ship.address.line1, ship.address.line2, ship.address.city, ship.address.postal_code]
          .filter(Boolean).join(', ')
      : '';

    const orderRow = {
      customer_name:      meta.customer_name || ship?.name || '',
      customer_email:     meta.customer_email,
      customer_phone:     meta.customer_phone || ship?.phone || '',
      delivery_method:    meta.delivery_method || 'pickup',
      shipping_address:   shippingAddress,
      postcode:           meta.postcode || ship?.address?.postal_code || '',
      items,
      total_amount:       pi.amount / 100,
      payment_status:     'paid',
      fulfillment_status: 'processing',
      stripe_session_id:  pi.id,
    };

    console.log(`[webhook] Inserting order for PI ${pi.id}:`, JSON.stringify({ email: orderRow.customer_email, total: orderRow.total_amount, items: items.length }));

    const { error: orderErr } = await supabaseAdmin.from('orders').insert(orderRow);
    if (orderErr) {
      console.error(`[webhook] ORDER INSERT FAILED for PI ${pi.id}:`, orderErr.message, '| code:', orderErr.code, '| details:', orderErr.details);
    } else {
      console.log(`[webhook] Order inserted successfully for PI ${pi.id}`);
    }

    // Confirmation email
    if (meta.customer_email) {
      sendOrderConfirmation(meta.customer_email, {
        name:            meta.customer_name || '',
        orderId:         pi.id,
        items,
        deliveryMethod:  meta.delivery_method || 'pickup',
        shippingAddress,
        totalPence:      pi.amount,
        discountPence:   parseInt(meta.discount_pence || '0', 10),
      }).catch(e => console.error('[webhook] Order confirmation email failed:', e.message));
    }

    const bottlesOrdered = items.reduce((s, i) => s + (i.q || i.qty || 0), 0);
    await handleRewardsAndLoyalty({
      customerEmail: meta.customer_email,
      bottlesOrdered,
      amountPence:   pi.amount,
      discountCode:  meta.discount_code,
      orderId:       pi.id,
    });
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object;
    console.log(`[webhook] payment_intent.payment_failed — PI ${pi.id} — ${pi.last_payment_error?.message}`);
  }

  // ── checkout.session.completed (Stripe Checkout hosted page) ─────────
  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object;
    const meta     = session.metadata || {};
    const shipping = session.shipping_details;
    const email    = session.customer_details?.email || '';
    const name     = session.customer_details?.name  || '';

    console.log(`[webhook] checkout.session.completed — session ${session.id} — £${((session.amount_total ?? 0) / 100).toFixed(2)} — ${email}`);

    // Fetch line items from Stripe (most accurate); fall back to session metadata
    let lineItems = [];
    try {
      const expanded = await stripe.checkout.sessions.listLineItems(
        session.id,
        { limit: 50, expand: ['data.price.product'] }
      );
      lineItems = expanded.data.map(li => ({
        n: li.description || li.price?.product?.name || 'Item',
        q: li.quantity,
        p: li.price?.unit_amount ?? 0,
      }));
    } catch (e) {
      console.error(`[webhook] Could not fetch line items for session ${session.id}:`, e.message);
      try {
        lineItems = JSON.parse(meta.items || '[]').map(i => ({ n: i.n, q: i.q, p: i.p }));
      } catch (e2) {
        console.error(`[webhook] Fallback items parse also failed for session ${session.id}:`, e2.message);
      }
    }

    const shippingAddress = shipping
      ? [shipping.address?.line1, shipping.address?.line2, shipping.address?.city, shipping.address?.postal_code]
          .filter(Boolean).join(', ')
      : meta.shipping_address || '';

    const orderRow = {
      customer_name:      name,
      customer_email:     email,
      customer_phone:     session.customer_details?.phone || meta.customer_phone || '',
      delivery_method:    meta.delivery_method || 'pickup',
      shipping_address:   shippingAddress,
      postcode:           shipping?.address?.postal_code || '',
      items:              lineItems,
      total_amount:       (session.amount_total ?? 0) / 100,
      payment_status:     'paid',
      fulfillment_status: 'processing',
      stripe_session_id:  session.id,
      // Subscription bottle selections — populated for subscription checkouts only.
      // Carried from Stripe session metadata.flavors_selected (set in create-checkout-session.js).
      bottle_selection:   meta.flavors_selected || null,
    };

    console.log(`[webhook] Inserting order for session ${session.id}:`, JSON.stringify({ email: orderRow.customer_email, total: orderRow.total_amount, items: lineItems.length }));

    const { error: orderErr } = await supabaseAdmin.from('orders').insert(orderRow);
    if (orderErr) {
      console.error(`[webhook] ORDER INSERT FAILED for session ${session.id}:`, orderErr.message, '| code:', orderErr.code, '| details:', orderErr.details);
    } else {
      console.log(`[webhook] Order inserted successfully for session ${session.id}`);
    }

    // Confirmation email
    if (email) {
      sendOrderConfirmation(email, {
        name,
        orderId:         session.id,
        items:           lineItems,
        deliveryMethod:  meta.delivery_method || 'pickup',
        shippingAddress,
        totalPence:      session.amount_total ?? 0,
        discountPence:   0,
      }).catch(e => console.error('[webhook] Order confirmation email failed:', e.message));
    }

    const bottlesOrdered = lineItems.reduce((s, i) => s + (i.q || 0), 0);
    await handleRewardsAndLoyalty({
      customerEmail: email,
      bottlesOrdered,
      amountPence:   session.amount_total ?? 0,
      discountCode:  meta.discount_code,
      orderId:       session.id,
    });
  }

  // ── invoice.paid (recurring subscription payments after the first) ───
  // The checkout.session.completed event handles the first payment.
  // Every subsequent renewal fires invoice.paid instead.
  if (event.type === 'invoice.paid') {
    const invoice      = event.data.object;
    const subscription = invoice.subscription;
    const email        = invoice.customer_email || '';
    const amountPaid   = invoice.amount_paid ?? 0;

    // Skip the first invoice — that is already handled by checkout.session.completed
    if (invoice.billing_reason === 'subscription_create') {
      console.log(`[webhook] invoice.paid (first payment) — skipping, handled by checkout.session.completed`);
      return res.status(200).json({ received: true });
    }

    console.log(`[webhook] invoice.paid (renewal) — sub ${subscription} — £${(amountPaid / 100).toFixed(2)} — ${email}`);

    // Pull flavors and quantity from the subscription's metadata
    let subMeta = {};
    try {
      const sub = await stripe.subscriptions.retrieve(subscription);
      subMeta   = sub.metadata || {};
    } catch (e) {
      console.error(`[webhook] Could not retrieve subscription ${subscription}:`, e.message);
    }

    const flavorsStr = subMeta.flavors_selected || '';
    const quantity   = subMeta.quantity || '?';
    const interval   = subMeta.interval || 'month';

    // Build a summary line item for the order
    const lineItems = [{
      name:  `Subscription Renewal — ${quantity} bottle${quantity !== '1' ? 's' : ''} (${interval}ly)${flavorsStr ? ': ' + flavorsStr : ''}`,
      qty:   parseInt(quantity) || 1,
      price: amountPaid / 100,
    }];

    const invoiceRef = `inv_${invoice.id}`;

    // Dedup — don't insert twice if webhook fires multiple times
    const { data: existing } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('stripe_session_id', invoiceRef)
      .maybeSingle();

    if (existing) {
      console.log(`[webhook] Renewal order already exists for invoice ${invoice.id}`);
      return res.status(200).json({ received: true });
    }

    const { error: invoiceOrderErr } = await supabaseAdmin.from('orders').insert({
      customer_name:      invoice.customer_name || '',
      customer_email:     email,
      customer_phone:     '',
      delivery_method:    'pickup',
      shipping_address:   '',
      postcode:           '',
      items:              lineItems,
      total_amount:       amountPaid / 100,
      payment_status:     'paid',
      fulfillment_status: 'processing',
      stripe_session_id:  invoiceRef,
      admin_note:         `Subscription renewal${flavorsStr ? ' — ' + flavorsStr : ''}`,
      // Bottle selections pulled from the subscription's Stripe metadata
      bottle_selection:   flavorsStr || null,
    });

    if (invoiceOrderErr) {
      console.error(`[webhook] Renewal order INSERT FAILED for invoice ${invoice.id}:`, invoiceOrderErr.message, invoiceOrderErr.code);
    } else {
      console.log(`[webhook] Renewal order created for invoice ${invoice.id}`);
    }
  }

  return res.status(200).json({ received: true });
}
