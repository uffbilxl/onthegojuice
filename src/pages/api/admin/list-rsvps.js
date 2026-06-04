import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminToken } from '@/lib/adminAuth';

export default async function handler(req, res) {
  if (!verifyAdminToken(req.cookies?.otgj_admin)) return res.status(401).end();

  if (req.method !== 'GET') return res.status(405).end();

  const { data, error } = await supabaseAdmin
    .from('event_rsvps')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error('[admin/list-rsvps]', error.message); return res.status(500).json({ error: 'Internal server error' }); }
  return res.status(200).json(data ?? []);
}
