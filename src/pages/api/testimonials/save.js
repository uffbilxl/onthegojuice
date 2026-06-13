import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { customer_name, video_url, cloudinary_public_id, caption } = req.body;

  if (!customer_name?.trim()) return res.status(400).json({ error: 'Customer name is required.' });
  if (!video_url?.trim())     return res.status(400).json({ error: 'Video URL is required.' });

  const { data, error } = await supabaseAdmin
    .from('testimonials')
    .insert({
      customer_name:       customer_name.trim(),
      video_url:           video_url.trim(),
      cloudinary_public_id: cloudinary_public_id?.trim() || null,
      caption:             caption?.trim() || null,
      status:              'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('[testimonials/save]', error.message);
    return res.status(500).json({ error: 'Failed to save testimonial.' });
  }

  return res.status(201).json(data);
}
