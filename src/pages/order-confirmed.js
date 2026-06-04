import Head from 'next/head';
import Link from 'next/link';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendOrderConfirmation } from '@/lib/mailer';

// ── Server-side: create order from Stripe session ────────────────────
export async function getServerSideProps({ query }) {
  const { session_id } = query;

  if (!session_id) {
    return { props: { status: 'no_session' } };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch (err) {
    console.error('[order-confirmed] Failed to retrieve Stripe session:', err.message);
    return { props: { status: 'stripe_error' } };
  }

  if (session.payment_status !== 'paid') {
    console.warn('[order-confirmed] Session not paid:', session_id, session.payment_status);
    return { props: { status: 'not_paid' } };
  }

  // Check if webhook already created this order
  const { data: existing, error: lookupErr } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('stripe_session_id', session_id)
    .maybeSingle();

  if (lookupErr) {
    console.error('[order-confirmed] Lookup error:', lookupErr.message, lookupErr.code);
  }

  if (existing) {
    console.log('[order-confirmed] Order already exists for session', session_id, '— webhook beat us, all good');
    return { props: { status: 'ok' } };
  }

  // Webhook hasn't fired yet (or failed) — create the order now
  console.log('[order-confirmed] Creating order for session', session_id);

  const meta     = session.metadata || {};
  const shipping = session.shipping_details;
  const email    = session.customer_details?.email || '';
  const name     = session.customer_details?.name  || '';
  const phone    = session.customer_details?.phone || meta.customer_phone || '';

  // Fetch line items from Stripe
  let lineItems = [];
  try {
    const expanded = await stripe.checkout.sessions.listLineItems(session_id, {
      limit: 50,
      expand: ['data.price.product'],
    });
    lineItems = expanded.data.map(li => ({
      name:  li.description || li.price?.product?.name || 'Item',
      qty:   li.quantity,
      price: (li.price?.unit_amount ?? 0) / 100,
    }));
  } catch (e) {
    console.error('[order-confirmed] Could not fetch line items:', e.message);
    // Fall back to metadata
    try {
      lineItems = JSON.parse(meta.items || '[]').map(i => ({ name: i.n, qty: i.q, price: i.p }));
    } catch (e2) {
      console.error('[order-confirmed] Metadata items parse also failed:', e2.message);
    }
  }

  const shippingAddress = shipping
    ? [shipping.address?.line1, shipping.address?.line2, shipping.address?.city, shipping.address?.postal_code]
        .filter(Boolean).join(', ')
    : meta.shipping_address || '';

  const orderRow = {
    customer_name:      name,
    customer_email:     email,
    customer_phone:     phone,
    delivery_method:    meta.delivery_method || 'pickup',
    shipping_address:   shippingAddress,
    postcode:           shipping?.address?.postal_code || '',
    items:              lineItems,
    total_amount:       (session.amount_total ?? 0) / 100,
    payment_status:     'paid',
    fulfillment_status: 'processing',
    stripe_session_id:  session_id,
  };

  console.log('[order-confirmed] Inserting:', JSON.stringify({
    email:  orderRow.customer_email,
    total:  orderRow.total_amount,
    items:  lineItems.length,
    method: orderRow.delivery_method,
  }));

  const { error: insertErr } = await supabaseAdmin.from('orders').insert(orderRow);

  if (insertErr) {
    console.error('[order-confirmed] INSERT FAILED — message:', insertErr.message);
    console.error('[order-confirmed] INSERT FAILED — code:', insertErr.code);
    console.error('[order-confirmed] INSERT FAILED — details:', insertErr.details);
    console.error('[order-confirmed] INSERT FAILED — hint:', insertErr.hint);
  } else {
    console.log('[order-confirmed] Order inserted successfully for session', session_id);

    // Send confirmation email (webhook would do this too, but it hasn't fired)
    if (email) {
      sendOrderConfirmation(email, {
        name,
        orderId:         session_id,
        items:           lineItems,
        deliveryMethod:  meta.delivery_method || 'pickup',
        shippingAddress,
        totalPence:      session.amount_total ?? 0,
        discountPence:   0,
      }).catch(e => console.error('[order-confirmed] Confirmation email failed:', e.message));
    }
  }

  return { props: { status: insertErr ? 'insert_error' : 'ok' } };
}

// ── Page ─────────────────────────────────────────────────────────────
export default function OrderConfirmed() {
  return (
    <>
      <Head>
        <title>Order Confirmed – On The Go Juice</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f4f1ec',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
          maxWidth: '540px',
          width: '100%',
          overflow: 'hidden',
        }}>

          <div style={{
            backgroundColor: '#1d6c00',
            padding: '32px 40px 28px',
            textAlign: 'center',
          }}>
            <img
              src="/images/logo.png"
              alt="On The Go Juice"
              style={{ display: 'block', margin: '0 auto', maxWidth: '140px', height: 'auto' }}
            />
            <p style={{
              margin: '14px 0 0',
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.60)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}>
              Fresh &bull; Natural &bull; On The Go
            </p>
          </div>

          <div style={{ padding: '44px 48px 40px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#f0fdf4',
              marginBottom: '24px',
            }}>
              <span style={{ fontSize: '34px', lineHeight: 1, color: '#1d6c00' }}>&#10003;</span>
            </div>

            <h1 style={{
              margin: '0 0 16px',
              fontSize: '30px',
              fontWeight: 900,
              color: '#111111',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}>
              Order Confirmed!
            </h1>

            <p style={{
              margin: '0 0 36px',
              fontSize: '15px',
              color: '#6b7280',
              lineHeight: 1.7,
            }}>
              Thank you for your order. Our team will be in touch shortly to
              confirm your delivery slot or pickup details.
            </p>

            <Link href="/" style={{
              display: 'inline-block',
              backgroundColor: '#1d6c00',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '16px',
              padding: '17px 44px',
              borderRadius: '50px',
              letterSpacing: '0.02em',
            }}>
              Return to Home
            </Link>
          </div>

          <div style={{
            backgroundColor: '#f4f1ec',
            borderTop: '1px solid #e5e7eb',
            padding: '22px 40px',
            textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af' }}>
              On The Go Juice &bull; Birmingham, UK
            </p>
            <p style={{ margin: 0, fontSize: '12px' }}>
              <a href="mailto:info@onthego-juice.co.uk" style={{ color: '#ff6b00', textDecoration: 'none' }}>
                info@onthego-juice.co.uk
              </a>
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
