import crypto from 'crypto';

export function generateShareCode() {
  return crypto.randomBytes(6).toString('base64url').slice(0, 8);
}

export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const rateLimitMap = new Map();

export function rateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const entry = rateLimitMap.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }

  entry.count++;
  rateLimitMap.set(key, entry);

  return entry.count <= maxRequests;
}
