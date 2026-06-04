// Temporary diagnostic endpoint — remove after debugging
// Access: /api/debug-db?key=otgj-debug

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.query.key !== 'otgj-debug') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const result = {
    env: {
      url:      url     ? url.slice(0, 40) + '...' : 'MISSING',
      svcKey:   svcKey  ? svcKey.slice(0, 30) + '...' : 'MISSING',
      anonKey:  anonKey ? anonKey.slice(0, 30) + '...' : 'MISSING',
    },
    tables: {},
    insertTest: null,
  };

  if (!url || !svcKey) {
    return res.status(500).json({ error: 'Missing env vars', result });
  }

  const admin = createClient(url, svcKey, { auth: { persistSession: false } });

  // Check which tables exist
  for (const table of ['orders', 'products', 'profiles', 'order_items']) {
    const { error } = await admin.from(table).select('id').limit(1);
    result.tables[table] = error ? `MISSING — ${error.message}` : 'exists';
  }

  // Try inserting a real-looking test order
  const testId = `debug-${Date.now()}`;
  const { error: insertErr } = await admin.from('orders').insert({
    customer_name:      'Debug Test',
    customer_email:     'debug@test.com',
    customer_phone:     '',
    delivery_method:    'pickup',
    shipping_address:   '',
    postcode:           '',
    items:              [],
    total_amount:       0.01,
    payment_status:     'paid',
    fulfillment_status: 'processing',
    stripe_session_id:  testId,
  });

  if (insertErr) {
    result.insertTest = { ok: false, error: insertErr.message, code: insertErr.code, hint: insertErr.hint };
  } else {
    result.insertTest = { ok: true };
    // Clean up
    await admin.from('orders').delete().eq('stripe_session_id', testId);
  }

  return res.status(200).json(result);
}
