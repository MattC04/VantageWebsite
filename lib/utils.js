import crypto from 'crypto';

// Generate a short, URL-safe share code (8 chars)
export function generateShareCode() {
  return crypto.randomBytes(6).toString('base64url').slice(0, 8);
}

// Generate a 32-byte random token (for email verification)
export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// SHA-256 hash of a token — only the hash is stored in DB
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Normalize email: lowercase + trim
export function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

// Basic email format check
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Simple in-memory rate limiter (resets on cold start — good enough for MVP)
// For production use Upstash Redis
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
