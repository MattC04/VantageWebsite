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
    const { data: owner, error: ownerErr } = await db
      .from('waitlist_users')
      .select('id, email, share_code, created_at')
      .eq('share_code', share_code)
      .maybeSingle();

    if (ownerErr || !owner) {
      return res.status(404).json({ error: 'Squad not found.' });
    }

    const { data: referrals } = await db
      .from('referrals')
      .select('invitee_id, created_at')
      .eq('inviter_id', owner.id)
      .order('created_at', { ascending: true });

    const members = [];
    if (referrals && referrals.length > 0) {
      const inviteeIds = referrals.map((r) => r.invitee_id);
      const { data: invitees } = await db
        .from('waitlist_users')
        .select('id, email')
        .in('id', inviteeIds);

      const inviteeMap = {};
      (invitees || []).forEach((u) => { inviteeMap[u.id] = u; });

      referrals.forEach((r) => {
        const u = inviteeMap[r.invitee_id];
        if (u) members.push({ id: u.id, email: u.email, joined_at: r.created_at });
      });
    }

    return res.status(200).json({
      share_code: owner.share_code,
      joined_at:  owner.created_at,
      members,
    });

  } catch (err) {
    console.error('Squad error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
