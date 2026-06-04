import { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendOrderConfirmation } from '@/lib/mailer';

export async function getServerSideProps({ query }) {
  try {
  const { session_id, payment_intent, redirect_status } = query;

  // Stripe Elements passes ?payment_intent=pi_xxx&redirect_status=succeeded
  // Stripe Checkout Session passes ?session_id=cs_xxx
  const stripeRef = session_id || payment_intent;
  if (!stripeRef) return { props: { status: 'no_session' } };

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // ── 1. Retrieve payment data from Stripe ───────────────────────
  let meta = {}, email = '', name = '', phone = '', shipping = null, totalPence = 0;

  if (payment_intent) {
    // Stripe Elements flow — retrieve the PaymentIntent
    if (redirect_status !== 'succeeded') {
      console.warn('[order-confirmed] payment_intent not succeeded:', payment_intent, redirect_status);
      return { props: { status: 'not_paid' } };
    }
    let pi;
    try {
      pi = await stripe.paymentIntents.retrieve(payment_intent);
    } catch (err) {
      console.error('[order-confirmed] paymentIntents.retrieve failed:', err.message);
      return { props: { status: 'stripe_error' } };
    }
    if (pi.status !== 'succeeded') {
      console.warn('[order-confirmed] PI not succeeded:', pi.id, pi.status);
      return { props: { status: 'not_paid' } };
    }
    meta       = pi.metadata || {};
    email      = meta.customer_email || '';
    name       = meta.customer_name  || pi.shipping?.name || '';
    phone      = meta.customer_phone || pi.shipping?.phone || '';
    shipping   = pi.shipping;
    totalPence = pi.amount;

  } else {
    // Stripe Checkout Session flow
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(session_id);
    } catch (err) {
      console.error('[order-confirmed] sessions.retrieve failed:', err.message);
      return { props: { status: 'stripe_error' } };
    }
    if (session.payment_status !== 'paid') {
      console.warn('[order-confirmed] session not paid:', session_id, session.payment_status);
      return { props: { status: 'not_paid' } };
    }
    meta       = session.metadata || {};
    email      = session.customer_details?.email || '';
    name       = session.customer_details?.name  || '';
    phone      = session.customer_details?.phone || meta.customer_phone || '';
    shipping   = session.shipping_details;
    totalPence = session.amount_total ?? 0;
  }

  // ── 2. Deduplicate — webhook may have already created this order ─
  const { data: existing, error: lookupErr } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('stripe_session_id', stripeRef)
    .maybeSingle();

  if (lookupErr) {
    console.error('[order-confirmed] dedup lookup error:', lookupErr.message, lookupErr.code);
  }

  if (existing) {
    console.log('[order-confirmed] order already exists for', stripeRef);
    return { props: { status: 'ok' } };
  }

  // ── 3. Resolve user_id (null for guests) ──────────────────────
  let userId = null;
  if (email) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    userId = profile?.id || null;
  }

  // ── 4. Build line items ────────────────────────────────────────
  let lineItems = [];
  try {
    lineItems = JSON.parse(meta.items || '[]').map(i => ({
      name:     i.n || i.name,
      quantity: i.q || i.qty,
      price:    (i.p || i.price_pence || 0) / 100,
    }));
  } catch (e) {
    console.error('[order-confirmed] items parse failed:', e.message);
  }

  // For Checkout Session flow also try to fetch from Stripe
  if (!lineItems.length && session_id) {
    try {
      const expanded = await stripe.checkout.sessions.listLineItems(session_id, {
        limit: 50, expand: ['data.price.product'],
      });
      lineItems = expanded.data.map(li => ({
        name:     li.description || li.price?.product?.name || 'Item',
        quantity: li.quantity,
        price:    (li.price?.unit_amount ?? 0) / 100,
      }));
    } catch (e) {
      console.error('[order-confirmed] listLineItems failed:', e.message);
    }
  }

  // ── 5. Build shipping address ──────────────────────────────────
  const shippingAddress = shipping?.address
    ? [shipping.address.line1, shipping.address.line2,
       shipping.address.city,  shipping.address.postal_code]
        .filter(Boolean).join(', ')
    : meta.shipping_address || '';

  // ── 6. Insert the order ───────────────────────────────────────
  const orderRow = {
    user_id:            userId,
    customer_name:      name,
    customer_email:     email,
    customer_phone:     phone,
    delivery_method:    meta.delivery_method || 'pickup',
    shipping_address:   shippingAddress,
    postcode:           shipping?.address?.postal_code || meta.postcode || '',
    items:              lineItems,
    total_amount:       totalPence / 100,
    payment_status:     'paid',
    fulfillment_status: 'processing',
    stripe_session_id:  stripeRef,
  };

  console.log('[order-confirmed] inserting order:', JSON.stringify({
    session_id,
    email:   orderRow.customer_email,
    user_id: orderRow.user_id,
    total:   orderRow.total_amount,
    items:   lineItems.length,
    method:  orderRow.delivery_method,
  }));

  const { data: newOrder, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert(orderRow)
    .select('id')
    .single();

  if (orderErr) {
    console.error('[order-confirmed] ORDER INSERT FAILED');
    console.error('  message:', orderErr.message);
    console.error('  code:   ', orderErr.code);
    console.error('  details:', orderErr.details);
    console.error('  hint:   ', orderErr.hint);
    return { props: { status: 'insert_error' } };
  }

  console.log('[order-confirmed] order created:', newOrder.id);

  // ── 7. Insert normalised order_items ──────────────────────────
  if (lineItems.length > 0 && newOrder?.id) {
    const itemRows = lineItems.map(li => ({
      order_id:          newOrder.id,
      product_id:        null,           // no direct DB FK at checkout time
      name:              li.name,
      quantity:          li.quantity,
      price_at_purchase: li.price,
    }));

    const { error: itemsErr } = await supabaseAdmin
      .from('order_items')
      .insert(itemRows);

    if (itemsErr) {
      console.error('[order-confirmed] order_items insert failed:', itemsErr.message, itemsErr.code);
    } else {
      console.log('[order-confirmed] inserted', itemRows.length, 'order_items for order', newOrder.id);
    }
  }

  // ── 8. Confirmation email ──────────────────────────────────────
  if (email) {
    sendOrderConfirmation(email, {
      name,
      orderId:         stripeRef,
      items:           lineItems,
      deliveryMethod:  meta.delivery_method || 'pickup',
      shippingAddress,
      totalPence,
      discountPence:   parseInt(meta.discount_pence || '0', 10),
    }).catch(e => console.error('[order-confirmed] confirmation email failed:', e.message));
  }

  return { props: { status: 'ok' } };

  } catch (err) {
    // Top-level safety net — never let a crash produce a 500 on this page.
    // The customer already paid; always show the confirmation.
    console.error('[order-confirmed] Unhandled error in getServerSideProps:', err.message);
    return { props: { status: 'ok' } };
  }
}

export default function OrderConfirmed() {
  useEffect(() => {
    // Clear the cart from localStorage so items don't persist after purchase
    try { localStorage.removeItem('otgj_cart'); } catch {}
  }, []);

  return (
    <>
      <Head>
        <title>Order Confirmed – On The Go Juice</title>
      </Head>
      <div style={{
        minHeight: '100vh', backgroundColor: '#f4f1ec',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 16px', fontFamily: 'Arial, Helvetica, sans-serif',
      }}>
        <div style={{
          background: '#ffffff', borderRadius: '18px',
          boxShadow: '0 4px 32px rgba(0,0,0,0.10)', maxWidth: '540px',
          width: '100%', overflow: 'hidden',
        }}>
          <div style={{ backgroundColor: '#1d6c00', padding: '32px 40px 28px', textAlign: 'center' }}>
            <img src="/images/logo.png" alt="On The Go Juice"
              style={{ display: 'block', margin: '0 auto', maxWidth: '140px', height: 'auto' }} />
            <p style={{ margin: '14px 0 0', fontSize: '11px', fontWeight: 700,
              color: 'rgba(255,255,255,0.60)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
              Fresh &bull; Natural &bull; On The Go
            </p>
          </div>
          <div style={{ padding: '44px 48px 40px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '72px', height: '72px', borderRadius: '50%',
              backgroundColor: '#f0fdf4', marginBottom: '24px',
            }}>
              <span style={{ fontSize: '34px', lineHeight: 1, color: '#1d6c00' }}>&#10003;</span>
            </div>
            <h1 style={{ margin: '0 0 16px', fontSize: '30px', fontWeight: 900,
              color: '#111111', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Order Confirmed!
            </h1>
            <p style={{ margin: '0 0 36px', fontSize: '15px', color: '#6b7280', lineHeight: 1.7 }}>
              Thank you for your order. Our team will be in touch shortly to
              confirm your delivery slot or pickup details.
            </p>
            <Link href="/" style={{
              display: 'inline-block', backgroundColor: '#1d6c00', color: '#ffffff',
              textDecoration: 'none', fontWeight: 700, fontSize: '16px',
              padding: '17px 44px', borderRadius: '50px', letterSpacing: '0.02em',
            }}>
              Return to Home
            </Link>
          </div>
          <div style={{ backgroundColor: '#f4f1ec', borderTop: '1px solid #e5e7eb',
            padding: '22px 40px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af' }}>
              On The Go Juice &bull; Birmingham, UK
            </p>
            <p style={{ margin: 0, fontSize: '12px' }}>
              <a href="mailto:info@onthego-juice.co.uk"
                style={{ color: '#ff6b00', textDecoration: 'none' }}>
                info@onthego-juice.co.uk
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
