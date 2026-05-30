import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { orderRef, email } = req.body;
  if (!orderRef || !email) {
    return res.status(400).json({ error: 'Please enter your order reference and email.' });
  }

  const ref = orderRef.replace(/^#?\s*OTGJ[-\s]?/i, '').toUpperCase().trim();
  if (ref.length !== 8) {
    return res.status(400).json({ error: 'Invalid order reference. It should look like OTGJ-A1B2C3D4.' });
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('customer_name, customer_email, delivery_method, shipping_address, items, total_amount, fulfillment_status, admin_note, created_at, stripe_session_id')
    .ilike('stripe_session_id', `%${ref}`)
    .eq('customer_email', email.toLowerCase().trim())
    .maybeSingle();

  if (error || !data) {
    return res.status(404).json({ error: 'No order found. Please check your reference and email.' });
  }

  return res.status(200).json({
    orderRef: `#OTGJ-${ref}`,
    customerName: data.customer_name,
    deliveryMethod: data.delivery_method,
    shippingAddress: data.shipping_address || '',
    items: Array.isArray(data.items) ? data.items : [],
    totalAmount: data.total_amount,
    fulfillmentStatus: data.fulfillment_status || 'processing',
    adminNote: data.admin_note || '',
    createdAt: data.created_at,
    canCancel: data.fulfillment_status === 'processing',
  });
}
