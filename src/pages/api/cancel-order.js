import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { orderRef, email } = req.body;
  if (!orderRef || !email) return res.status(400).json({ error: 'Missing order reference or email.' });

  const ref = orderRef.replace(/^#?\s*OTGJ[-\s]?/i, '').toUpperCase().trim();

  const { data } = await supabaseAdmin
    .from('orders')
    .select('id, fulfillment_status')
    .ilike('stripe_session_id', `%${ref}`)
    .eq('customer_email', email.toLowerCase().trim())
    .maybeSingle();

  if (!data) return res.status(404).json({ error: 'Order not found.' });

  if (data.fulfillment_status !== 'processing') {
    return res.status(400).json({ error: 'This order can no longer be cancelled as it is already being prepared or delivered.' });
  }

  const { error } = await supabaseAdmin
    .from('orders')
    .update({ fulfillment_status: 'cancelled' })
    .eq('id', data.id);

  if (error) return res.status(500).json({ error: 'Failed to cancel order. Please contact us directly.' });

  return res.status(200).json({ success: true });
}
