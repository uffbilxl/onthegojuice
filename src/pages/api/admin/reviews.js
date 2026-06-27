import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminToken } from '@/lib/adminAuth';

function isAuthorized(req) {
  return verifyAdminToken(req.cookies?.otgj_admin);
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { console.error('[admin/reviews GET]', error.message); return res.status(500).json({ error: 'Internal server error' }); }
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required.' });

    const { error } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) { console.error('[admin/reviews DELETE]', error.message); return res.status(500).json({ error: 'Failed to delete review.' }); }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
