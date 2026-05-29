import { supabaseAdmin } from '@/lib/supabaseAdmin';

const VALID_STATUSES = [
  'processing',
  'out_for_delivery',
  'completed',
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Validate admin cookie
  const cookie = req.cookies?.otgj_admin;
  if (cookie !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { orderId, fulfillmentStatus } = req.body;

  if (!orderId || !VALID_STATUSES.includes(fulfillmentStatus)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const { error } = await supabaseAdmin
    .from('orders')
    .update({ fulfillment_status: fulfillmentStatus })
    .eq('id', orderId);

  if (error) {
    console.error('[update-fulfillment]', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true });
}
