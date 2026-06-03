import { supabaseAdmin } from '@/lib/supabaseAdmin';

function isAuthorized(req) {
  return req.cookies?.otgj_admin === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  // ── GET: list all users with their profile data ──────────────────
  if (req.method === 'GET') {
    const { data: { users }, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });
    if (authErr) {
      console.error('[admin/users GET]', authErr.message);
      return res.status(500).json({ error: 'Failed to load users' });
    }

    const { data: profiles, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, role, company_name, welcome_discount_claimed, bottle_progress, lifetime_bottles_bought, created_at');

    if (profErr) {
      console.error('[admin/users profiles]', profErr.message);
      return res.status(500).json({ error: 'Failed to load profiles' });
    }

    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p; });

    const merged = users.map(u => ({
      id:                       u.id,
      email:                    u.email,
      email_verified:           !!u.email_confirmed_at,
      first_name:               u.user_metadata?.first_name || '',
      last_name:                u.user_metadata?.last_name  || '',
      created_at:               u.created_at,
      role:                     profileMap[u.id]?.role            ?? 'customer',
      company_name:             profileMap[u.id]?.company_name    ?? '',
      welcome_discount_claimed: profileMap[u.id]?.welcome_discount_claimed ?? false,
      bottle_progress:          profileMap[u.id]?.bottle_progress          ?? 0,
      lifetime_bottles_bought:  profileMap[u.id]?.lifetime_bottles_bought  ?? 0,
    }));

    // Sort: corporate first, then alphabetically by email
    merged.sort((a, b) => {
      if (a.role === 'corporate' && b.role !== 'corporate') return -1;
      if (b.role === 'corporate' && a.role !== 'corporate') return  1;
      return a.email.localeCompare(b.email);
    });

    return res.status(200).json(merged);
  }

  // ── PATCH: update role and/or company_name ───────────────────────
  if (req.method === 'PATCH') {
    const { userId, role, company_name } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId required' });

    if (role && !['customer', 'corporate', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const updates = {};
    if (role        !== undefined) updates.role         = role;
    if (company_name !== undefined) updates.company_name = company_name || null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('id, role, company_name')
      .single();

    if (error) {
      console.error('[admin/users PATCH]', error.message);
      return res.status(500).json({ error: 'Update failed: ' + error.message });
    }

    return res.status(200).json(data);
  }

  return res.status(405).end();
}
