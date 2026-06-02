import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.cookies?.otgj_admin !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('id');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'PATCH') {
    const { id, price_pence, name, active } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing product id' });

    const updates = {};
    if (typeof price_pence === 'number' && price_pence > 0) updates.price_pence = Math.round(price_pence);
    if (typeof name === 'string' && name.trim()) updates.name = name.trim();
    if (typeof active === 'boolean') updates.active = active;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).end();
}
