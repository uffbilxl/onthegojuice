import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, subject, message } = req.body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  try {
    const { error } = await supabaseAdmin.from('contact_messages').insert({
      name:    name.trim(),
      email:   email.trim().toLowerCase(),
      subject: subject?.trim() || null,
      message: message.trim(),
    });

    if (error) {
      console.error('[api/contact] insert failed:', error.message, error.code);
      return res.status(500).json({ error: 'Failed to send message. Please try again.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[api/contact] unexpected error:', err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
