import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const VALID_ORG_TYPES   = ['gym', 'cafe', 'corporate', 'other'];
const VALID_WEEKLY_VOLS = ['1-20', '21-50', '51-100', '100+'];

// Wholesale sample packs based on estimated weekly volume
const SAMPLE_PACKS = {
  '1-20':   { qty: 12,  label: 'Wholesale Taster Pack (12 bottles)',  unitPence: 299 },
  '21-50':  { qty: 24,  label: 'Wholesale Starter Pack (24 bottles)', unitPence: 299 },
  '51-100': { qty: 48,  label: 'Wholesale Trial Pack (48 bottles)',   unitPence: 279 },
  '100+':   { qty: 60,  label: 'Wholesale Bulk Pack (60 bottles)',    unitPence: 259 },
};

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

  // Save inquiry to DB
  const { error: dbErr } = await supabaseAdmin
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

  if (dbErr) {
    console.error('[partner-checkout] db insert failed:', dbErr.message);
    // Non-fatal — still proceed to Stripe so the partner can order
  }

  const pack = SAMPLE_PACKS[weekly_volume];
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://onthegojuice.vercel.app';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email.trim().toLowerCase(),

      line_items: [{
        price_data: {
          currency:     'gbp',
          product_data: {
            name:        pack.label,
            description: `Wholesale pricing for ${business_name.trim()} — mixed flavours, freshly prepared.`,
          },
          unit_amount: pack.unitPence,
        },
        quantity: pack.qty,
      }],

      automatic_payment_methods:    { enabled: true },
      billing_address_collection:   'required',
      shipping_address_collection:  { allowed_countries: ['GB'] },

      success_url: `${base}/thank-you?type=partner&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${base}/partners`,

      metadata: {
        type:          'partner_order',
        business_name: business_name.trim().slice(0, 200),
        contact_name:  contact_name.trim().slice(0, 200),
        phone:         phone.trim().slice(0, 50),
        org_type,
        weekly_volume,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[partner-checkout] Stripe error:', err.message);
    return res.status(500).json({ error: 'Failed to create checkout. Please try again.' });
  }
}
