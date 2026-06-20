import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminToken } from '@/lib/adminAuth';

const ALLOWED = {
  orders:            'orders',
  rsvps:             'event_rsvps',
  partners:          'partner_inquiries',
  testimonials:      'testimonials',
};

export default async function handler(req, res) {
  if (!verifyAdminToken(req.cookies?.otgj_admin)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'DELETE') return res.status(405).end();

  const { table } = req.body ?? {};
  const realTable = ALLOWED[table];
  if (!realTable) return res.status(400).json({ error: 'Unknown table.' });

  const { error } = await supabaseAdmin.from(realTable).delete().not('id', 'is', null);
  if (error) {
    console.error(`[admin/reset] ${realTable}:`, error.message);
    return res.status(500).json({ error: error.message });
  }
  return res.status(200).json({ ok: true });
}
