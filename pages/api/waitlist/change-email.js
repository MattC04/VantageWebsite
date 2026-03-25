import { getServiceClient } from '../../../lib/supabase';
import { normalizeEmail, isValidEmail, rateLimit } from '../../../lib/utils';

export const config = { api: { bodyParser: { sizeLimit: '4kb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';

  if (!rateLimit(`change-email:ip:${ip}`, 3, 60_000)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  const { current_email, new_email } = req.body || {};

  if (!current_email || typeof current_email !== 'string') {
    return res.status(400).json({ error: 'Invalid request.' });
  }
  if (!new_email || typeof new_email !== 'string') {
    return res.status(400).json({ error: 'New email is required.' });
  }

  const normalizedCurrent = normalizeEmail(current_email);
  const normalizedNew = normalizeEmail(new_email);

  if (!isValidEmail(normalizedNew)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (!rateLimit(`change-email:email:${normalizedNew}`, 2, 60_000)) {
    return res.status(429).json({ error: 'Too many requests for this email.' });
  }

  const db = getServiceClient();

  try {
    const { data: user } = await db
      .from('waitlist_users')
      .select('id, email')
      .eq('email', normalizedCurrent)
      .maybeSingle();

    if (!user) {
      return res.status(404).json({ error: 'Email not found.' });
    }

    if (user.email === normalizedNew) {
      return res.status(200).json({ ok: true });
    }

    const { data: existingNew } = await db
      .from('waitlist_users')
      .select('id')
      .eq('email', normalizedNew)
      .maybeSingle();

    if (existingNew && existingNew.id !== user.id) {
      await db.from('waitlist_users').delete().eq('id', existingNew.id);
    }

    const { error: updateErr } = await db
      .from('waitlist_users')
      .update({ email: normalizedNew })
      .eq('id', user.id);

    if (updateErr) throw updateErr;

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Change email error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
