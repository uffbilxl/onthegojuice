import crypto from 'crypto';
import { serialize } from 'cookie';
import { checkRateLimit, createAdminToken } from '@/lib/adminAuth';

function passwordsMatch(input, expected) {
  if (!input || !expected) return false;
  const a = Buffer.from(String(input));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) {
    // Run a dummy comparison to avoid length-based timing oracle
    try { crypto.timingSafeEqual(b, b); } catch {}
    return false;
  }
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket?.remoteAddress
    || 'unknown';

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many login attempts. Please try again in 15 minutes.' });
  }

  const { password } = req.body;
  if (!passwordsMatch(password, process.env.ADMIN_PASSWORD)) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const token = createAdminToken();

  res.setHeader(
    'Set-Cookie',
    serialize('otgj_admin', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })
  );

  return res.status(200).json({ ok: true });
}
