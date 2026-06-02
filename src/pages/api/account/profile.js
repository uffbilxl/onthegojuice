import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Invalid session' });

  if (req.method !== 'GET') return res.status(405).end();

  const [profileRes, rewardsRes] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('welcome_discount_claimed, bottle_progress, lifetime_bottles_bought, created_at')
      .eq('id', user.id)
      .maybeSingle(),
    supabaseAdmin
      .from('user_rewards')
      .select('id, type, promo_code, created_at')
      .eq('user_id', user.id)
      .eq('redeemed', false)
      .order('created_at', { ascending: false }),
  ]);

  if (profileRes.error || !profileRes.data) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const p = profileRes.data;

  return res.status(200).json({
    email:                   user.email,
    email_verified:          !!user.email_confirmed_at,
    welcome_discount_claimed: p.welcome_discount_claimed,
    bottle_progress:         p.bottle_progress,
    lifetime_bottles_bought: p.lifetime_bottles_bought,
    member_since:            p.created_at,
    rewards:                 rewardsRes.data || [],
  });
}
