import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminToken } from '@/lib/adminAuth';

export default async function handler(req, res) {
  if (!verifyAdminToken(req.cookies?.otgj_admin)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = {};

  // 1. Can we read from orders?
  const { data: rows, error: readErr } = await supabaseAdmin
    .from('orders')
    .select('id, stripe_session_id, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  results.read = readErr
    ? { ok: false, error: readErr.message, code: readErr.code }
    : { ok: true, recentOrders: rows?.length ?? 0 };

  // 2. Can we insert a test row?
  const testId = `test-${Date.now()}`;
  const { error: insertErr } = await supabaseAdmin.from('orders').insert({
    customer_name:      'DB Test',
    customer_email:     'test@test.com',
    customer_phone:     '',
    delivery_method:    'pickup',
    shipping_address:   '',
    postcode:           '',
    items:              [],
    total_amount:       0.01,
    payment_status:     'test',
    fulfillment_status: 'processing',
    stripe_session_id:  testId,
  });

  results.insert = insertErr
    ? { ok: false, error: insertErr.message, code: insertErr.code, details: insertErr.details, hint: insertErr.hint }
    : { ok: true, testSessionId: testId };

  // 3. Clean up the test row
  if (!insertErr) {
    const { error: deleteErr } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('stripe_session_id', testId);
    results.cleanup = deleteErr ? { ok: false, error: deleteErr.message } : { ok: true };
  }

  // 4. Env var presence check
  results.env = {
    SUPABASE_URL:              !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY:         !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET:     !!process.env.STRIPE_WEBHOOK_SECRET,
  };

  const allOk = results.read.ok && results.insert.ok;
  return res.status(allOk ? 200 : 500).json(results);
}
