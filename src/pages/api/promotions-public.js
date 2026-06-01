import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { data, error } = await supabaseAdmin
    .from('promotions_config')
    .select('id, name, description, badge_text, min_qty, total_price_pence')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('[promotions-public]', error);
    return res.status(500).json({ error: error.message });
  }

  // Cache for 60s at the CDN, serve stale for up to 5min while revalidating
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return res.status(200).json(data ?? []);
}
