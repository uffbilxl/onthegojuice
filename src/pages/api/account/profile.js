import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  // Verify JWT and get the user identity
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Invalid session' });

  if (req.method === 'GET') {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('loyalty_points, created_at')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !profile) return res.status(404).json({ error: 'Profile not found' });

    return res.status(200).json({
      email: user.email,
      loyalty_points: profile.loyalty_points,
      member_since: profile.created_at,
    });
  }

  return res.status(405).end();
}
