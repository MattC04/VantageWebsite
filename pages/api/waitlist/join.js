import { getServiceClient } from '../../../lib/supabase';
import { generateShareCode, generateToken, hashToken, normalizeEmail, isValidEmail, rateLimit } from '../../../lib/utils';
import { sendVerificationEmail } from '../../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || '';

  if (!rateLimit(`join:ip:${ip}`, 5, 60_000)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  const { email, share_code: refCode } = req.body || {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (!rateLimit(`join:email:${normalizedEmail}`, 3, 60_000)) {
    return res.status(429).json({ error: 'Too many requests for this email.' });
  }

  const db = getServiceClient();

  try {
    let userId;
    let existingUser;

    const { data: existing } = await db
      .from('waitlist_users')
      .select('id, status')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existing?.status === 'VERIFIED') {
      const { data: squad } = await db
        .from('squads')
        .select('share_code')
        .eq('owner_waitlist_user_id', existing.id)
        .maybeSingle();

      return res.status(200).json({
        already_verified: true,
        share_code: squad?.share_code,
      });
    }

    if (existing) {
      userId = existing.id;
      existingUser = existing;
    } else {
      const { data: newUser, error: insertErr } = await db
        .from('waitlist_users')
        .insert({
          email:            normalizedEmail,
          status:           'PENDING',
          ip_first:         ip,
          user_agent_first: userAgent,
        })
        .select('id')
        .single();

      if (insertErr) throw insertErr;
      userId = newUser.id;
    }

    let shareCode;
    const { data: existingSquad } = await db
      .from('squads')
      .select('share_code')
      .eq('owner_waitlist_user_id', userId)
      .maybeSingle();

    if (existingSquad) {
      shareCode = existingSquad.share_code;
    } else {
      let attempts = 0;
      let newCode;
      while (attempts < 10) {
        newCode = generateShareCode();
        const { data: collision } = await db
          .from('squads')
          .select('id')
          .eq('share_code', newCode)
          .maybeSingle();
        if (!collision) break;
        attempts++;
      }

      const { data: newSquad, error: squadErr } = await db
        .from('squads')
        .insert({ owner_waitlist_user_id: userId, share_code: newCode })
        .select('share_code')
        .single();

      if (squadErr) throw squadErr;
      shareCode = newSquad.share_code;
    }

    if (refCode && typeof refCode === 'string') {
      const { data: refSquad } = await db
        .from('squads')
        .select('id, owner_waitlist_user_id')
        .eq('share_code', refCode)
        .maybeSingle();

      if (refSquad && refSquad.owner_waitlist_user_id !== userId) {
        const { data: existingRef } = await db
          .from('referrals')
          .select('id')
          .eq('invitee_waitlist_user_id', userId)
          .maybeSingle();

        if (!existingRef) {
          await db.from('referrals').insert({
            squad_id:                 refSquad.id,
            inviter_waitlist_user_id: refSquad.owner_waitlist_user_id,
            invitee_waitlist_user_id: userId,
            status:                   'PENDING',
          });
        }
      }
    }

    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db
      .from('email_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('waitlist_user_id', userId)
      .is('used_at', null);

    await db.from('email_verification_tokens').insert({
      waitlist_user_id: userId,
      token_hash:       tokenHash,
      expires_at:       expiresAt.toISOString(),
    });

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

    return res.status(200).json({ share_code: shareCode });

  } catch (err) {
    console.error('Join error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
