import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Invalid session' });

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'corporate') {
    return res.status(403).json({ error: 'Corporate account required' });
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, name, category, price_pence, wholesale_price_pence')
    .eq('active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('[corporate/products]', error.message);
    return res.status(500).json({ error: 'Failed to load products' });
  }

  // Fallback: if wholesale_price_pence is null, calculate 30% off
  const products = data.map(p => ({
    ...p,
    wholesale_price_pence: p.wholesale_price_pence ?? Math.round(p.price_pence * 0.70),
  }));

  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(200).json(products);
}
