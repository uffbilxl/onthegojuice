import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminToken } from '@/lib/adminAuth';

export default async function handler(req, res) {
  if (!verifyAdminToken(req.cookies?.otgj_admin)) return res.status(401).end();

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('partner_inquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('[admin/list-partners GET]', error.message); return res.status(500).json({ error: 'Internal server error' }); }
    return res.status(200).json(data ?? []);
  }

  if (req.method === 'PATCH') {
    const { id, status } = req.body;
    const valid = ['new', 'contacted', 'active', 'declined'];
    if (!id || !valid.includes(status)) return res.status(400).json({ error: 'Invalid.' });
    const { error } = await supabaseAdmin.from('partner_inquiries').update({ status }).eq('id', id);
    if (error) { console.error('[admin/list-partners PATCH]', error.message); return res.status(500).json({ error: 'Internal server error' }); }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
