import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminToken } from '@/lib/adminAuth';

export default async function handler(req, res) {
  const authorized = await verifyAdminToken(req);
  if (!authorized) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('discount_codes')
      .select('*')
      .eq('type', 'promo')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { code, discount_percent, discount_fixed_pence, min_order_pence } = req.body;

    if (!code?.trim()) return res.status(400).json({ error: 'Code is required.' });
    if (!discount_percent && !discount_fixed_pence) {
      return res.status(400).json({ error: 'Either a percentage or fixed amount is required.' });
    }

    const clean = code.trim().toUpperCase().replace(/\s+/g, '');

    const { data, error } = await supabaseAdmin
      .from('discount_codes')
      .insert({
        code:                 clean,
        type:                 'promo',
        used:                 false,
        discount_percent:     discount_percent     ? Number(discount_percent)     : null,
        discount_fixed_pence: discount_fixed_pence ? Number(discount_fixed_pence) : null,
        min_order_pence:      min_order_pence      ? Number(min_order_pence)      : 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'That code already exists.' });
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID required.' });

    const { error } = await supabaseAdmin
      .from('discount_codes')
      .delete()
      .eq('id', id)
      .eq('type', 'promo');

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
