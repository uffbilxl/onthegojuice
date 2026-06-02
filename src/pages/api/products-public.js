import { supabaseAdmin } from '@/lib/supabaseAdmin';

let cache = null;
let cacheAt = 0;
const CACHE_TTL = 60_000; // 60 seconds

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  if (cache && Date.now() - cacheAt < CACHE_TTL) {
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    return res.status(200).json(cache);
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, name, category, price_pence')
    .eq('active', true)
    .order('id');

  if (error) {
    console.error('[products-public]', error.message);
    return res.status(500).json({ error: 'Failed to load products' });
  }

  cache = data.map(p => ({ ...p, price: p.price_pence / 100 }));
  cacheAt = Date.now();

  res.setHeader('Cache-Control', 'public, s-maxage=60');
  return res.status(200).json(cache);
}
