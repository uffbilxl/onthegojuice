import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendWelcomeDiscount } from '@/lib/mailer';

function generateCode() {
  // Avoid visually confusing chars (0/O, 1/I/l)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `OTGJ${rand}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;
  if (!email || !/.+@.+\..+/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const normalised = email.toLowerCase().trim();

  // If they already have a welcome code, just resend it
  const { data: existing } = await supabaseAdmin
    .from('discount_codes')
    .select('code')
    .eq('email', normalised)
    .eq('type', 'welcome')
    .maybeSingle();

  let code = existing?.code;

  if (!code) {
    code = generateCode();
    const { error } = await supabaseAdmin.from('discount_codes').insert({
      code,
      email: normalised,
      type: 'welcome',
      discount_percent: 20,
      min_order_pence: 1000,
    });
    if (error) {
      console.error('[subscribe] DB insert error:', error.message);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  }

  try {
    await sendWelcomeDiscount(normalised, code);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[subscribe] Email error:', err.message);
    return res.status(500).json({ error: 'Failed to send email. Please try again.' });
  }
}
