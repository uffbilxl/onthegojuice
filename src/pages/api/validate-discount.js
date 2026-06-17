import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code, subtotalPence, email: requestEmail } = req.body;
  if (!code) return res.status(400).json({ error: 'Please enter a discount code.' });

  const { data, error } = await supabaseAdmin
    .from('discount_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .maybeSingle();

  if (error || !data) {
    return res.status(400).json({ error: 'Invalid or already used code.' });
  }

  // Single-use codes (welcome, referral, etc.) are blocked once marked used.
  // Promo codes (type = 'promo') are multi-use and skip this check.
  if (data.type !== 'promo' && data.used) {
    return res.status(400).json({ error: 'Invalid or already used code.' });
  }

  // ── One-time-use enforcement for welcome codes ──────────────────────
  // Use the email stored ON the code row (always present, regardless of
  // whether the user has typed their email into the form yet).
  if (data.type === 'welcome' && data.email) {
    const codeEmail = data.email.toLowerCase();

    // 1. Check profile flag — set when the code was first redeemed
    const { data: prof } = await supabaseAdmin
      .from('profiles')
      .select('welcome_discount_claimed')
      .eq('email', codeEmail)
      .maybeSingle();

    if (prof?.welcome_discount_claimed) {
      return res.status(400).json({ error: 'This discount code has already been used.' });
    }

    // 2. Check used_discounts ledger (belt-and-suspenders; handles guests)
    const { data: alreadyUsed, error: ledgerErr } = await supabaseAdmin
      .from('used_discounts')
      .select('id')
      .eq('email', codeEmail)
      .eq('discount_code', data.code)
      .maybeSingle();

    if (!ledgerErr && alreadyUsed) {
      return res.status(400).json({ error: 'This discount code has already been used.' });
    }

    // 3. If the caller sent their email, also check it directly
    if (requestEmail) {
      const reqEmailLower = requestEmail.toLowerCase();

      if (reqEmailLower !== codeEmail) {
        return res.status(400).json({ error: 'This discount code is not valid for your account.' });
      }
    }
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
