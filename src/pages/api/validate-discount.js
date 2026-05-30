import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code, subtotalPence } = req.body;
  if (!code) return res.status(400).json({ error: 'Please enter a discount code.' });

  const { data, error } = await supabaseAdmin
    .from('discount_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('used', false)
    .maybeSingle();

  if (error || !data) {
    return res.status(400).json({ error: 'Invalid or already used code.' });
  }

  const sub = parseInt(subtotalPence, 10) || 0;

  if (sub < data.min_order_pence) {
    return res.status(400).json({
      error: `This code requires a minimum spend of £${(data.min_order_pence / 100).toFixed(2)}.`,
    });
  }

  let discountPence;
  let message;

  if (data.discount_percent) {
    discountPence = Math.round(sub * data.discount_percent / 100);
    message = `${data.discount_percent}% discount applied — saving £${(discountPence / 100).toFixed(2)}`;
  } else if (data.discount_fixed_pence) {
    discountPence = Math.min(data.discount_fixed_pence, sub);
    message = `£${(discountPence / 100).toFixed(2)} discount applied`;
  } else {
    return res.status(400).json({ error: 'Invalid code configuration.' });
  }

  return res.status(200).json({
    valid: true,
    code: data.code,
    discountPence,
    message,
  });
}
