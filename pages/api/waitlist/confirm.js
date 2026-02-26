import { getServiceClient } from '../../../lib/supabase';
import { hashToken } from '../../../lib/utils';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.redirect(302, '/?verify=invalid');
  }

  const db = getServiceClient();
  const tokenHash = hashToken(token);
  const now = new Date().toISOString();

  try {
    // 1. Find valid token
    const { data: tokenRow, error: tokenErr } = await db
      .from('email_verification_tokens')
      .select('id, waitlist_user_id, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (tokenErr || !tokenRow) {
      return res.redirect(302, '/?verify=invalid');
    }

    if (tokenRow.used_at) {
      // Already used — try to get their squad and redirect there
      const { data: squad } = await db
        .from('squads')
        .select('share_code')
        .eq('owner_waitlist_user_id', tokenRow.waitlist_user_id)
        .maybeSingle();
      const dest = squad ? `/squad/${squad.share_code}?verified=1` : '/?verify=already_used';
      return res.redirect(302, dest);
    }

    if (new Date(tokenRow.expires_at) < new Date()) {
      return res.redirect(302, '/?verify=expired');
    }

    // 2. Mark token used
    await db
      .from('email_verification_tokens')
      .update({ used_at: now })
      .eq('id', tokenRow.id);

    // 3. Mark user verified
    await db
      .from('waitlist_users')
      .update({ status: 'VERIFIED', verified_at: now })
      .eq('id', tokenRow.waitlist_user_id);

    // 4. If this user was referred, upgrade their referral to VERIFIED
    const { data: referral } = await db
      .from('referrals')
      .select('id, inviter_waitlist_user_id')
      .eq('invitee_waitlist_user_id', tokenRow.waitlist_user_id)
      .maybeSingle();

    if (referral) {
      await db
        .from('referrals')
        .update({ status: 'VERIFIED', verified_at: now })
        .eq('id', referral.id);

      // 5. Recompute inviter's tier unlocks
      await recomputeTierUnlocks(db, referral.inviter_waitlist_user_id);
    }

    // 6. Get share code and redirect to squad page
    const { data: squad } = await db
      .from('squads')
      .select('share_code')
      .eq('owner_waitlist_user_id', tokenRow.waitlist_user_id)
      .maybeSingle();

    const dest = squad ? `/squad/${squad.share_code}?verified=1` : '/?verify=ok';
    return res.redirect(302, dest);

  } catch (err) {
    console.error('Confirm error:', err);
    return res.redirect(302, '/?verify=error');
  }
}

// Recompute and update tier unlocks for an inviter after a new verified referral
async function recomputeTierUnlocks(db, inviterUserId) {
  try {
    // Count verified referrals for this inviter
    const { count: verifiedCount } = await db
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('inviter_waitlist_user_id', inviterUserId)
      .in('status', ['VERIFIED', 'ACTIVATED']);

    const { count: activatedCount } = await db
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('inviter_waitlist_user_id', inviterUserId)
      .eq('status', 'ACTIVATED');

    // Get all reward tiers
    const { data: tiers } = await db
      .from('reward_tiers')
      .select('tier_number, required_verified');

    if (!tiers) return;

    const now = new Date().toISOString();

    for (const tier of tiers) {
      const shouldUnlock = (verifiedCount || 0) >= tier.required_verified;
      const shouldPayable = (activatedCount || 0) >= tier.required_verified;

      // Get existing unlock record
      const { data: existing } = await db
        .from('reward_unlocks')
        .select('id, status')
        .eq('waitlist_user_id', inviterUserId)
        .eq('tier_number', tier.tier_number)
        .maybeSingle();

      if (!existing) {
        if (shouldUnlock) {
          await db.from('reward_unlocks').insert({
            waitlist_user_id: inviterUserId,
            tier_number:      tier.tier_number,
            status:           shouldPayable ? 'PAYABLE' : 'UNLOCKED',
            unlocked_at:      now,
            payable_at:       shouldPayable ? now : null,
          });
        }
        // else leave it — no record means LOCKED
      } else if (existing.status === 'UNLOCKED' && shouldPayable) {
        await db.from('reward_unlocks')
          .update({ status: 'PAYABLE', payable_at: now })
          .eq('id', existing.id);
      } else if (existing.status === 'LOCKED' && shouldUnlock) {
        await db.from('reward_unlocks')
          .update({
            status:      shouldPayable ? 'PAYABLE' : 'UNLOCKED',
            unlocked_at: now,
            payable_at:  shouldPayable ? now : null,
          })
          .eq('id', existing.id);
      }
    }
  } catch (err) {
    console.error('recomputeTierUnlocks error:', err);
  }
}
