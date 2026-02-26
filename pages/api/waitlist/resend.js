import { getServiceClient } from '../../../lib/supabase';
import { generateToken, hashToken, normalizeEmail, isValidEmail, rateLimit } from '../../../lib/utils';
import { sendVerificationEmail } from '../../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';

  const { email } = req.body || {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  if (!rateLimit(`resend:email:${normalizedEmail}`, 1, 60_000)) {
    return res.status(429).json({ error: 'Please wait a minute before resending.' });
  }

  if (!rateLimit(`resend:email:hr:${normalizedEmail}`, 3, 3_600_000)) {
    return res.status(429).json({ error: 'Too many resend attempts. Try again later.' });
  }

  if (!rateLimit(`resend:ip:${ip}`, 5, 60_000)) {
    return res.status(429).json({ error: 'Too many requests.' });
  }

  const db = getServiceClient();

  try {
    const { data: user } = await db
      .from('waitlist_users')
      .select('id, status')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!user || user.status === 'VERIFIED') {
      return res.status(200).json({ ok: true });
    }

    const now = new Date().toISOString();
    await db
      .from('email_verification_tokens')
      .update({ used_at: now })
      .eq('waitlist_user_id', user.id)
      .is('used_at', null);

    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await db.from('email_verification_tokens').insert({
      waitlist_user_id: user.id,
      token_hash:       tokenHash,
      expires_at:       expiresAt,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host}`;
    const verifyUrl = `${baseUrl}/api/waitlist/confirm?token=${token}`;

    await sendVerificationEmail({
      toEmail:   normalizedEmail,
      toName:    normalizedEmail.split('@')[0],
      verifyUrl,
    });

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
