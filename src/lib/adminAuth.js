import crypto from 'crypto';

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

// Best-effort in-memory rate limiter.
// Resets on serverless cold starts, but still stops automated brute-force within a warm instance.
const loginAttempts = new Map(); // ip → { count, firstAt }
const MAX_ATTEMPTS  = 10;
const WINDOW_MS     = 15 * 60 * 1000; // 15-minute window

export function checkRateLimit(ip) {
  const now   = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.firstAt >= WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAt: now });
    return true;
  }
  entry.count++;
  return entry.count <= MAX_ATTEMPTS;
}

// Stateless HMAC token: "<timestamp>.<HMAC-SHA256(ADMIN_PASSWORD, timestamp)>"
// The timestamp bounds token lifetime; the HMAC proves it was issued by a valid login.
export function createAdminToken() {
  const ts  = Date.now().toString();
  const sig = crypto.createHmac('sha256', process.env.ADMIN_PASSWORD || '').update(ts).digest('hex');
  return `${ts}.${sig}`;
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return false;
  const dot = token.lastIndexOf('.');
  if (dot < 1) return false;

  const ts  = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const age = Date.now() - parseInt(ts, 10);
  if (!Number.isFinite(age) || age < 0 || age > TOKEN_TTL_MS) return false;

  const expected = crypto
    .createHmac('sha256', process.env.ADMIN_PASSWORD || '')
    .update(ts)
    .digest('hex');

  if (sig.length !== expected.length) return false;

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sig, 'hex'));
  } catch {
    return false;
  }
}
