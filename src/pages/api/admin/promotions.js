import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminToken } from '@/lib/adminAuth';

export default async function handler(req, res) {
  if (!verifyAdminToken(req.cookies?.otgj_admin)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('promotions_config')
      .select('*')
      .order('sort_order');
    if (error) { console.error('[admin/promotions GET]', error.message); return res.status(500).json({ error: 'Internal server error' }); }
    return res.status(200).json(data ?? []);
  }

  if (req.method === 'PATCH') {
    const { id, is_active } = req.body;
    if (!id || typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'id and is_active (boolean) are required' });
    }
    const { data, error } = await supabaseAdmin
      .from('promotions_config')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error('[admin/promotions PATCH]', error.message); return res.status(500).json({ error: 'Internal server error' }); }
    return res.status(200).json(data);
  }

  return res.status(405).end();
}
