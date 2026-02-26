import { getServiceClient } from '../../../lib/supabase';
import { generateShareCode, generateToken, hashToken, normalizeEmail, isValidEmail, rateLimit } from '../../../lib/utils';
import { sendVerificationEmail } from '../../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';

  // Rate limit: 3 per minute per IP
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
    // 1. Find the squad by share_code to get old owner
    const { data: squad } = await db
      .from('squads')
      .select('id, owner_waitlist_user_id, share_code')
      .eq('share_code', share_code)
      .maybeSingle();

    if (!squad) {
      return res.status(404).json({ error: 'Squad not found.' });
    }

    const oldUserId = squad.owner_waitlist_user_id;

    // 2. Check old owner is PENDING (can't change a verified email via this flow)
    const { data: oldUser } = await db
      .from('waitlist_users')
      .select('id, status, email')
      .eq('id', oldUserId)
      .maybeSingle();

    if (!oldUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (oldUser.status === 'VERIFIED') {
      return res.status(400).json({ error: 'Your email is already verified. You cannot change it.' });
    }

    // 3. Check new email isn't already registered to another VERIFIED user
    const { data: existingNew } = await db
      .from('waitlist_users')
      .select('id, status')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingNew && existingNew.id !== oldUserId) {
      if (existingNew.status === 'VERIFIED') {
        return res.status(409).json({ error: 'That email is already verified on another account.' });
      }
      // Another PENDING user with this email exists — we'll recycle their slot
      // Delete the old unverified duplicate to keep things clean
      await db.from('email_verification_tokens').delete().eq('waitlist_user_id', existingNew.id);
      await db.from('squads').delete().eq('owner_waitlist_user_id', existingNew.id);
      await db.from('referrals').delete().eq('invitee_waitlist_user_id', existingNew.id);
      await db.from('waitlist_users').delete().eq('id', existingNew.id);
    }

    // 4. Check if new email is same as old email — just resend
    const sameEmail = oldUser.email === normalizedEmail;

    let newUserId = oldUserId;
    let newShareCode = squad.share_code;

    if (!sameEmail) {
      // 5a. Update the user's email in place (simpler than delete+recreate, preserves referrals)
      const { error: updateErr } = await db
        .from('waitlist_users')
        .update({ email: normalizedEmail, status: 'PENDING' })
        .eq('id', oldUserId);

      if (updateErr) throw updateErr;
    }

    // 6. Invalidate all old tokens
    await db
      .from('email_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('waitlist_user_id', newUserId)
      .is('used_at', null);

    // 7. Create new verification token
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.from('email_verification_tokens').insert({
      waitlist_user_id: newUserId,
      token_hash:       tokenHash,
      expires_at:       expiresAt.toISOString(),
    });

    // 8. Send verification email to new address
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host}`;
    const verifyUrl = `${baseUrl}/api/waitlist/confirm?token=${token}`;

    try {
      await sendVerificationEmail({
        toEmail:   normalizedEmail,
        toName:    normalizedEmail.split('@')[0],
        verifyUrl,
      });
    } catch (emailErr) {
      console.error('Email send failed:', emailErr);
    }

    return res.status(200).json({
      ok: true,
      new_share_code: newShareCode,
    });

  } catch (err) {
    console.error('Change email error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
