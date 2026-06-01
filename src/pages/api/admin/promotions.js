import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  // Cookie-based admin auth (same pattern as rest of admin API)
  const cookie = req.cookies?.otgj_admin;
  if (cookie !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('promotions_config')
      .select('*')
      .order('sort_order');
    if (error) return res.status(500).json({ error: error.message });
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
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).end();
}
