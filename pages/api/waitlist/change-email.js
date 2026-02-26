import { getServiceClient } from '../../../lib/supabase';
import { normalizeEmail, isValidEmail, rateLimit } from '../../../lib/utils';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';

  if (!rateLimit(`change-email:ip:${ip}`, 3, 60_000)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  const { share_code, new_email } = req.body || {};

  if (!share_code || typeof share_code !== 'string') {
    return res.status(400).json({ error: 'Invalid request.' });
  }
  if (!new_email || typeof new_email !== 'string') {
    return res.status(400).json({ error: 'New email is required.' });
  }

  const normalizedEmail = normalizeEmail(new_email);
  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (!rateLimit(`change-email:email:${normalizedEmail}`, 2, 60_000)) {
    return res.status(429).json({ error: 'Too many requests for this email.' });
  }

  const db = getServiceClient();

  try {
    const { data: squad } = await db
      .from('squads')
      .select('id, owner_waitlist_user_id, share_code')
      .eq('share_code', share_code)
      .maybeSingle();

    if (!squad) {
      return res.status(404).json({ error: 'Squad not found.' });
    }

    const oldUserId = squad.owner_waitlist_user_id;

    const { data: oldUser } = await db
      .from('waitlist_users')
      .select('id, email')
      .eq('id', oldUserId)
      .maybeSingle();

    if (!oldUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (oldUser.email === normalizedEmail) {
      return res.status(200).json({ ok: true, new_share_code: squad.share_code });
    }

    // If another account already has this email, delete it (it's unverified by definition now)
    const { data: existingNew } = await db
      .from('waitlist_users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingNew && existingNew.id !== oldUserId) {
      await db.from('squads').delete().eq('owner_waitlist_user_id', existingNew.id);
      await db.from('referrals').delete().eq('invitee_waitlist_user_id', existingNew.id);
      await db.from('waitlist_users').delete().eq('id', existingNew.id);
    }

    const { error: updateErr } = await db
      .from('waitlist_users')
      .update({ email: normalizedEmail })
      .eq('id', oldUserId);

    if (updateErr) throw updateErr;

    return res.status(200).json({ ok: true, new_share_code: squad.share_code });

  } catch (err) {
    console.error('Change email error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
