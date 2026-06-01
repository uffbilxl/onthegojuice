import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.cookies?.otgj_admin !== process.env.ADMIN_PASSWORD) return res.status(401).end();

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('partner_inquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data ?? []);
  }

  if (req.method === 'PATCH') {
    const { id, status } = req.body;
    const valid = ['new', 'contacted', 'active', 'declined'];
    if (!id || !valid.includes(status)) return res.status(400).json({ error: 'Invalid.' });
    const { error } = await supabaseAdmin.from('partner_inquiries').update({ status }).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
