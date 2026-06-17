import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendOrderStatusUpdate, sendOrderCancelled, sendOrderNote } from '@/lib/mailer';
import { verifyAdminToken } from '@/lib/adminAuth';

const VALID_STATUSES = ['processing', 'out_for_delivery', 'completed', 'cancelled'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!verifyAdminToken(req.cookies?.otgj_admin)) {
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

  // Always fetch order so we have customer details for emails
  const { data: orderData } = await supabaseAdmin
    .from('orders')
    .select('customer_email, customer_name, stripe_session_id, fulfillment_status')
    .eq('id', orderId)
    .maybeSingle();

  const { error } = await supabaseAdmin.from('orders').update(update).eq('id', orderId);

  if (error) {
    console.error('[update-fulfillment]', error);
    return res.status(500).json({ error: error.message });
  }

  if (orderData?.customer_email) {
    const emailId = orderData.stripe_session_id || orderId;
    const emailName = orderData.customer_name || '';

    // Status change emails
    if (fulfillmentStatus && fulfillmentStatus !== orderData.fulfillment_status) {
      try {
        if (fulfillmentStatus === 'cancelled') {
          await sendOrderCancelled(orderData.customer_email, { name: emailName, orderId: emailId });
        } else {
          await sendOrderStatusUpdate(orderData.customer_email, { name: emailName, orderId: emailId, status: fulfillmentStatus });
        }
      } catch (e) {
        console.error('[update-fulfillment] Status email failed:', e.message);
      }
    }

    // Note email — only when a non-empty note is provided
    if (adminNote && adminNote.trim()) {
      try {
        await sendOrderNote(orderData.customer_email, { name: emailName, orderId: emailId, note: adminNote.trim() });
      } catch (e) {
        console.error('[update-fulfillment] Note email failed:', e.message);
      }
    }
  }

  return res.status(200).json({ ok: true });
}
