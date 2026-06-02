import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendWelcomeDiscount } from '@/lib/mailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function generateCode(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return prefix + Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  // ── 1. Verify identity ────────────────────────────────────────────
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Invalid session' });

  // ── 2. Require verified email — closes the infinite-signup exploit ─
  if (!user.email_confirmed_at) {
    return res.status(403).json({
      error: 'Please verify your email address first. Check your inbox for the confirmation link.',
    });
  }

  // ── 3. Check profile hasn't already claimed ───────────────────────
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('welcome_discount_claimed')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  if (profile.welcome_discount_claimed) {
    return res.status(409).json({ error: 'Welcome discount already claimed.' });
  }

  // ── 4. Optimistic lock — mark claimed before touching Stripe ──────
  //      If two concurrent requests arrive for the same user, only one
  //      will match the WHERE welcome_discount_claimed = false clause.
  const { count } = await supabaseAdmin
    .from('profiles')
    .update({ welcome_discount_claimed: true })
    .eq('id', user.id)
    .eq('welcome_discount_claimed', false)
    .select('id', { count: 'exact', head: true });

  if (count === 0) {
    return res.status(409).json({ error: 'Welcome discount already claimed.' });
  }

  const codeStr = generateCode('WELCOME');

  try {
    // ── 5. Create Stripe coupon + single-use promotion code ───────────
    const coupon = await stripe.coupons.create({
      percent_off: 20,
      duration:    'once',
      name:        'OTGJ Welcome 20% Off',
      metadata:    { user_id: user.id, email: user.email, type: 'welcome_20pct' },
    });

    const stripePromo = await stripe.promotionCodes.create({
      coupon:           coupon.id,
      code:             codeStr,
      max_redemptions:  1,
      metadata:         { user_id: user.id, email: user.email },
    });

    // ── 6. Persist in user_rewards (dashboard display) ────────────────
    await supabaseAdmin.from('user_rewards').insert({
      user_id:          user.id,
      email:            user.email,
      type:             'welcome_20pct',
      promo_code:       codeStr,
      stripe_coupon_id: coupon.id,
      stripe_promo_id:  stripePromo.id,
    });

    // ── 7. Also persist in discount_codes (checkout validator) ────────
    await supabaseAdmin.from('discount_codes').insert({
      code:             codeStr,
      email:            user.email,
      type:             'welcome',
      discount_percent: 20,
      min_order_pence:  1000,   // £10 minimum order
    });

    // ── 8. Send the welcome email ─────────────────────────────────────
    sendWelcomeDiscount(user.email, codeStr).catch(e =>
      console.error('[claim-welcome] Email failed:', e.message)
    );

    return res.status(200).json({ code: codeStr });

  } catch (err) {
    // ── Rollback the claimed flag so the user can retry ───────────────
    await supabaseAdmin
      .from('profiles')
      .update({ welcome_discount_claimed: false })
      .eq('id', user.id);

    console.error('[claim-welcome]', err.message);
    return res.status(500).json({ error: 'Failed to generate your discount code. Please try again.' });
  }
}
