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

  const { share_code, new_email, member_id } = req.body || {};

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
    const { data: owner } = await db
      .from('waitlist_users')
      .select('id, share_code')
      .eq('share_code', share_code)
      .maybeSingle();

    if (!owner) {
      return res.status(404).json({ error: 'Squad not found.' });
    }

    let targetId;
    if (member_id) {
      const { data: ref } = await db
        .from('referrals')
        .select('invitee_id')
        .eq('inviter_id', owner.id)
        .eq('invitee_id', member_id)
        .maybeSingle();

      if (!ref) {
        return res.status(403).json({ error: 'That member is not in your squad.' });
      }
      targetId = member_id;
    } else {
      targetId = owner.id;
    }

    const { data: targetUser } = await db
      .from('waitlist_users')
      .select('id, email')
      .eq('id', targetId)
      .maybeSingle();

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (targetUser.email === normalizedEmail) {
      return res.status(200).json({ ok: true });
    }

    const { data: existingNew } = await db
      .from('waitlist_users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingNew && existingNew.id !== targetId) {
      await db.from('waitlist_users').delete().eq('id', existingNew.id);
    }

    const { error: updateErr } = await db
      .from('waitlist_users')
      .update({ email: normalizedEmail })
      .eq('id', targetId);

    if (updateErr) throw updateErr;

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Change email error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
