import { supabaseAdmin } from '@/lib/supabaseAdmin';

const VALID_ORG_TYPES    = ['gym', 'cafe', 'corporate', 'other'];
const VALID_WEEKLY_VOLS  = ['1-20', '21-50', '51-100', '100+'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { business_name, contact_name, email, phone, org_type, weekly_volume, message } = req.body;

  if (!business_name?.trim() || !contact_name?.trim() || !email?.trim() || !phone?.trim() || !org_type || !weekly_volume) {
    return res.status(400).json({ error: 'All required fields must be completed.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (!VALID_ORG_TYPES.includes(org_type)) {
    return res.status(400).json({ error: 'Invalid organisation type.' });
  }

  if (!VALID_WEEKLY_VOLS.includes(weekly_volume)) {
    return res.status(400).json({ error: 'Invalid weekly volume selection.' });
  }

  const { error } = await supabaseAdmin
    .from('partner_inquiries')
    .insert({
      business_name: business_name.trim(),
      contact_name:  contact_name.trim(),
      email:         email.trim().toLowerCase(),
      phone:         phone.trim(),
      org_type,
      weekly_volume,
      message:       message?.trim() || null,
    });

  if (error) {
    console.error('[partner-inquiry]', error);
    return res.status(500).json({ error: 'Submission failed. Please try again.' });
  }

  return res.status(200).json({ ok: true });
}
