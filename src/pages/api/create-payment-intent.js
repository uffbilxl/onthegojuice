import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

// Authoritative server-side prices in pence — never trust client-sent prices
const PRODUCT_PRICES = {
  1: 199, 2: 199, 3: 199, 4: 199, 5: 199, 6: 199,
  7: 199, 8: 199, 9: 199, 10: 199, 11: 199, 12: 199,
  13: 199, 14: 199, 15: 199, 16: 199,
  17: 150, 18: 150, 19: 150,
};

const DELIVERY_FEE = 150;           // £1.50
const FREE_DELIVERY_THRESHOLD = 1000; // £10.00

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { items, deliveryMethod, customer, address } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Calculate total server-side
  let subtotal = 0;
  for (const item of items) {
    const unitPrice = PRODUCT_PRICES[item.id];
    if (!unitPrice) return res.status(400).json({ error: `Unknown product id: ${item.id}` });
    if (!Number.isInteger(item.qty) || item.qty < 1) return res.status(400).json({ error: 'Invalid quantity' });
    subtotal += unitPrice * item.qty;
  }

  const isDelivery = deliveryMethod === 'local_delivery';
  const deliveryFee = isDelivery && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;
  const totalAmount = subtotal + deliveryFee;

  // Compact items for metadata (Stripe: 500 char limit per value)
  const itemsMeta = JSON.stringify(
    items.map(i => ({ id: i.id, n: (i.name || '').slice(0, 25), q: i.qty }))
  ).slice(0, 490);

  const params = {
    amount: totalAmount,
    currency: 'gbp',
    automatic_payment_methods: { enabled: true },
    metadata: {
      delivery_method: isDelivery ? 'local_delivery' : 'pickup',
      customer_name: (customer?.name || '').slice(0, 200),
      customer_email: (customer?.email || '').slice(0, 200),
      customer_phone: (customer?.phone || '').slice(0, 100),
      postcode: (address?.postcode || '').slice(0, 20),
      items: itemsMeta,
    },
  };

  // Attach shipping address for delivery orders
  if (isDelivery && address?.line1) {
    params.shipping = {
      name: customer?.name || 'Customer',
      phone: customer?.phone || undefined,
      address: {
        line1: address.line1 || '',
        line2: address.line2 || '',
        city: address.city || 'Birmingham',
        postal_code: address.postcode || '',
        country: 'GB',
      },
    };
  }

  try {
    const intent = await stripe.paymentIntents.create(params);
    return res.status(200).json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error('[create-payment-intent]', err);
    return res.status(500).json({ error: 'Payment initialization failed. Please try again.' });
  }
}
