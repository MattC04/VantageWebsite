import { getServiceClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { share_code } = req.query;

  if (!share_code || typeof share_code !== 'string') {
    return res.status(400).json({ error: 'Invalid share code.' });
  }

  const db = getServiceClient();

  try {
    const { data: squad, error: squadErr } = await db
      .from('squads')
      .select('id, owner_waitlist_user_id, share_code, created_at')
      .eq('share_code', share_code)
      .maybeSingle();

    if (squadErr || !squad) {
      return res.status(404).json({ error: 'Squad not found.' });
    }

    const { data: owner } = await db
      .from('waitlist_users')
      .select('status, created_at')
      .eq('id', squad.owner_waitlist_user_id)
      .maybeSingle();

    const { count: verifiedCount } = await db
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('inviter_waitlist_user_id', squad.owner_waitlist_user_id)
      .in('status', ['VERIFIED', 'ACTIVATED']);

    const { count: activatedCount } = await db
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('inviter_waitlist_user_id', squad.owner_waitlist_user_id)
      .eq('status', 'ACTIVATED');

    const { data: tiers } = await db
      .from('reward_tiers')
      .select('tier_number, required_verified, reward_title, reward_description, requires_activation')
      .order('tier_number');

    const { data: unlocks } = await db
      .from('reward_unlocks')
      .select('tier_number, status, unlocked_at, payable_at')
      .eq('waitlist_user_id', squad.owner_waitlist_user_id);

    const unlockMap = {};
    (unlocks || []).forEach((u) => { unlockMap[u.tier_number] = u; });

    const tierList = (tiers || []).map((tier) => {
      const unlock = unlockMap[tier.tier_number];
      const unlockStatus = unlock?.status || 'LOCKED';
      return {
        tier_number:         tier.tier_number,
        required_verified:   tier.required_verified,
        reward_title:        tier.reward_title,
        reward_description:  tier.reward_description,
        requires_activation: tier.requires_activation,
        status:              unlockStatus,
        unlocked_at:         unlock?.unlocked_at || null,
      };
    });

    return res.status(200).json({
      share_code:     squad.share_code,
      owner_status:   owner?.status || 'PENDING',
      verified_count: verifiedCount || 0,
      activated_count: activatedCount || 0,
      tiers:          tierList,
      joined_at:      squad.created_at,
    });

  } catch (err) {
    console.error('Squad progress error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
