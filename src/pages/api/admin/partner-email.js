import { sendPartnerAccepted, sendPartnerDeclined } from '@/lib/mailer';
import { verifyAdminToken } from '@/lib/adminAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!verifyAdminToken(req.cookies?.otgj_admin)) return res.status(401).end();

  const { email, business_name, contact_name, action } = req.body;

  if (!email || !action || !['accepted', 'declined'].includes(action)) {
    return res.status(400).json({ error: 'Email and a valid action (accepted or declined) are required.' });
  }

  try {
    if (action === 'accepted') {
      await sendPartnerAccepted(email, { businessName: business_name, contactName: contact_name });
    } else {
      await sendPartnerDeclined(email, { businessName: business_name, contactName: contact_name });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[partner-email]', err);
    return res.status(500).json({ error: 'Failed to send email. Please try again.' });
  }
}
