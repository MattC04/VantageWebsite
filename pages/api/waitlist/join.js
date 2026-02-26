import { getServiceClient } from '../../../lib/supabase';
import { generateShareCode, normalizeEmail, isValidEmail, rateLimit } from '../../../lib/utils';

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

    const { data: existing } = await db
      .from('waitlist_users')
      .select('id, status')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existing) {
      userId = existing.id;

      // If somehow still pending, upgrade to verified
      if (existing.status === 'PENDING') {
        await db
          .from('waitlist_users')
          .update({ status: 'VERIFIED', verified_at: new Date().toISOString() })
          .eq('id', userId);
      }
    } else {
      const { data: newUser, error: insertErr } = await db
        .from('waitlist_users')
        .insert({
          email:            normalizedEmail,
          status:           'VERIFIED',
          verified_at:      new Date().toISOString(),
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
            status:                   'VERIFIED',
            verified_at:              new Date().toISOString(),
          });

          await recomputeTierUnlocks(db, refSquad.owner_waitlist_user_id);
        }
      }
    }

    return res.status(200).json({ share_code: shareCode });

  } catch (err) {
    console.error('Join error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function recomputeTierUnlocks(db, inviterUserId) {
  try {
    const { count: verifiedCount } = await db
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('inviter_waitlist_user_id', inviterUserId)
      .in('status', ['VERIFIED', 'ACTIVATED']);

    const { data: tiers } = await db
      .from('reward_tiers')
      .select('tier_number, required_verified');

    if (!tiers) return;

    const now = new Date().toISOString();

    for (const tier of tiers) {
      const shouldUnlock = (verifiedCount || 0) >= tier.required_verified;

      const { data: existing } = await db
        .from('reward_unlocks')
        .select('id, status')
        .eq('waitlist_user_id', inviterUserId)
        .eq('tier_number', tier.tier_number)
        .maybeSingle();

      if (!existing && shouldUnlock) {
        await db.from('reward_unlocks').insert({
          waitlist_user_id: inviterUserId,
          tier_number:      tier.tier_number,
          status:           'UNLOCKED',
          unlocked_at:      now,
        });
      }
    }
  } catch (err) {
    console.error('recomputeTierUnlocks error:', err);
  }
}
