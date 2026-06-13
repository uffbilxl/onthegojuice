import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminToken } from '@/lib/adminAuth';

function isAuthorized(req) {
  return verifyAdminToken(req.cookies?.otgj_admin);
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { console.error('[admin/testimonials GET]', error.message); return res.status(500).json({ error: 'Internal server error' }); }
    return res.status(200).json(data);
  }

  if (req.method === 'PATCH') {
    const { id, status } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required.' });
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'status must be approved or rejected.' });

    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) { console.error('[admin/testimonials PATCH]', error.message); return res.status(500).json({ error: 'Internal server error' }); }
    return res.status(200).json(data);
  }

  return res.status(405).end();
}
