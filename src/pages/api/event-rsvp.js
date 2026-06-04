import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, attendees, message, event_id, event_name } = req.body;

  if (!name?.trim() || !email?.trim() || !attendees) {
    return res.status(400).json({ error: 'Name, email, and number of attendees are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  const { error } = await supabaseAdmin
    .from('event_rsvps')
    .insert({
      name:       name.trim(),
      email:      email.trim().toLowerCase(),
      attendees:  String(attendees),
      message:    message?.trim() || null,
      event_id:   event_id   || null,
      event_name: event_name || null,
    });

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'This email has already been registered for this event.' });
    }
    console.error('[event-rsvp]', error.message, error.code);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }

  return res.status(200).json({ ok: true });
}
