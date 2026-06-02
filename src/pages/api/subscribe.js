import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Newsletter sign-up only — no discount codes generated here.
// Welcome discounts are now issued exclusively to verified accounts at /account.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;
  if (!email || !/.+@.+\..+/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const normalised = email.toLowerCase().trim();

  // Record the newsletter subscriber (idempotent — ignore duplicate emails)
  const { error } = await supabaseAdmin
    .from('discount_codes')
    .insert({
      code:             `NEWS-${Date.now()}`, // placeholder, not a real discount
      email:            normalised,
      type:             'newsletter',
      discount_percent: 0,
      min_order_pence:  0,
    })
    .select()
    .maybeSingle();

  // Silently swallow duplicate errors — the important thing is the user sees success
  if (error && !error.message.includes('unique')) {
    console.error('[subscribe]', error.message);
  }

  // Redirect users to sign up for the real discount
  return res.status(200).json({
    success: true,
    message: 'Thanks for subscribing! Create a free account to unlock your 20% welcome discount.',
    redirect: '/account',
  });
}
