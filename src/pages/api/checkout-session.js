import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items, email, phone, deliveryMethod, address } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const origin = req.headers.origin || 'http://localhost:3001';

  // Build Stripe line_items from cart
  const lineItems = items.map((item) => ({
    price_data: {
      currency: 'gbp',
      product_data: {
        name: item.name,
        description: item.ingredients || undefined,
      },
      unit_amount: Math.round(item.price * 100), // pence
    },
    quantity: item.qty,
  }));

  // Add £1.50 delivery fee for orders under £10
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const chargesDelivery = deliveryMethod === 'local_delivery' && subtotal < 10;
  if (chargesDelivery) {
    lineItems.push({
      price_data: {
        currency: 'gbp',
        product_data: { name: 'Local Delivery' },
        unit_amount: 150,
      },
      quantity: 1,
    });
  }

  // Compact metadata (Stripe limit: 500 chars per value)
  const itemsMeta = JSON.stringify(
    items.map((i) => ({ n: i.name, q: i.qty, p: i.price }))
  ).slice(0, 490);

  const sessionParams = {
    mode: 'payment',
    line_items: lineItems,
    customer_email: email || undefined,

    automatic_payment_methods: { enabled: true },

    phone_number_collection: { enabled: true },

    metadata: {
      items: itemsMeta,
      delivery_method: deliveryMethod,
      customer_phone: phone || '',
      shipping_address: address
        ? `${address.line1 || ''}, ${address.city || ''}, ${address.postcode || ''}`.trim()
        : '',
    },

    success_url: `${origin}/order-confirmed?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout`,
  };

  // Collect billing + shipping address for local delivery
  if (deliveryMethod === 'local_delivery') {
    sessionParams.billing_address_collection = 'required';
    sessionParams.shipping_address_collection = {
      allowed_countries: ['GB'],
    };
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[checkout-session]', err);
    return res.status(500).json({ error: err.message });
  }
}
