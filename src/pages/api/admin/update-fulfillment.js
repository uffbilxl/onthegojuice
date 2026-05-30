import { supabaseAdmin } from '@/lib/supabaseAdmin';

const VALID_STATUSES = ['processing', 'out_for_delivery', 'completed', 'cancelled'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const cookie = req.cookies?.otgj_admin;
  if (cookie !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { orderId, fulfillmentStatus, adminNote } = req.body;

  if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

  const update = {};
  if (fulfillmentStatus !== undefined) {
    if (!VALID_STATUSES.includes(fulfillmentStatus)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    update.fulfillment_status = fulfillmentStatus;
  }
  if (adminNote !== undefined) {
    update.admin_note = adminNote;
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  const { error } = await supabaseAdmin.from('orders').update(update).eq('id', orderId);

  if (error) {
    console.error('[update-fulfillment]', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true });
}
