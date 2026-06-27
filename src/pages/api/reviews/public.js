import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('id, customer_name, rating, review_text, flavor, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[reviews/public]', error.message);
    return res.status(500).json({ error: 'Failed to fetch reviews.' });
  }

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return res.status(200).json(data);
}
