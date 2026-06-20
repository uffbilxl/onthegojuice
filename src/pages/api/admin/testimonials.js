import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminToken } from '@/lib/adminAuth';

function isAuthorized(req) {
  return verifyAdminToken(req.cookies?.otgj_admin);
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { console.error('[admin/testimonials GET]', error.message); return res.status(500).json({ error: 'Internal server error' }); }
    return res.status(200).json(data);
  }

  if (req.method === 'PATCH') {
    const { id, status, customer_name, caption } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required.' });
    if (!['approved', 'rejected', 'pending'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });

    const updateData = { status };
    if (typeof customer_name === 'string' && customer_name.trim()) updateData.customer_name = customer_name.trim();
    if (typeof caption       === 'string') updateData.caption = caption.trim() || null;

    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) { console.error('[admin/testimonials PATCH]', error.message); return res.status(500).json({ error: 'Internal server error' }); }
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required.' });

    const { data: record, error: fetchErr } = await supabaseAdmin
      .from('testimonials')
      .select('cloudinary_public_id, video_url')
      .eq('id', id)
      .single();

    if (fetchErr) return res.status(500).json({ error: 'Failed to find record.' });

    if (record?.cloudinary_public_id) {
      const publicId    = record.cloudinary_public_id;
      const resourceType = record.video_url?.includes('/image/upload/') ? 'image' : 'video';
      const timestamp   = Math.round(Date.now() / 1000);
      const secret      = process.env.CLOUDINARY_API_SECRET;
      const signature   = crypto
        .createHash('sha1')
        .update(`public_id=${publicId}&timestamp=${timestamp}${secret}`)
        .digest('hex');

      const form = new URLSearchParams();
      form.append('public_id',  publicId);
      form.append('timestamp',  String(timestamp));
      form.append('api_key',    process.env.CLOUDINARY_API_KEY);
      form.append('signature',  signature);

      await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/destroy`,
        { method: 'POST', body: form }
      ).catch(err => console.error('[testimonials DELETE] Cloudinary destroy failed:', err));
    }

    const { error: deleteErr } = await supabaseAdmin
      .from('testimonials')
      .delete()
      .eq('id', id);

    if (deleteErr) { console.error('[admin/testimonials DELETE]', deleteErr.message); return res.status(500).json({ error: 'Failed to delete testimonial.' }); }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
