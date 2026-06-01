import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { parse } from 'cookie';

function isAuthorized(req) {
  const cookies = parse(req.headers.cookie || '');
  return cookies.otgj_admin === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  // GET — list all events
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('event_config')
      .select('*')
      .order('event_date', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // POST — create new event
  if (req.method === 'POST') {
    const { name, description, event_date, location_name, address, is_active } = req.body;
    if (!name?.trim() || !event_date || !location_name?.trim()) {
      return res.status(400).json({ error: 'Name, date, and location are required.' });
    }
    const { data, error } = await supabaseAdmin
      .from('event_config')
      .insert({ name: name.trim(), description: description?.trim() || null, event_date, location_name: location_name.trim(), address: address?.trim() || null, is_active: is_active !== false })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  // PATCH — update existing event
  if (req.method === 'PATCH') {
    const { id, ...fields } = req.body;
    if (!id) return res.status(400).json({ error: 'Event id is required.' });
    const allowed = ['name', 'description', 'event_date', 'location_name', 'address', 'is_active'];
    const update = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)));
    const { data, error } = await supabaseAdmin
      .from('event_config')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // DELETE — remove event
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Event id is required.' });
    const { error } = await supabaseAdmin.from('event_config').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
