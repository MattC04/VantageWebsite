import { getServiceClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { room_share_code, member_id } = req.body || {};

  if (!room_share_code || typeof room_share_code !== 'string') {
    return res.status(400).json({ error: 'Invalid request.' });
  }
  if (!member_id || typeof member_id !== 'string') {
    return res.status(400).json({ error: 'Invalid request.' });
  }

  const db = getServiceClient();

  try {
    const { data: owner } = await db
      .from('waitlist_users')
      .select('id')
      .eq('share_code', room_share_code)
      .maybeSingle();

    if (!owner) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    await db
      .from('referrals')
      .delete()
      .eq('inviter_id', owner.id)
      .eq('invitee_id', member_id);

    const { count: remaining } = await db
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('inviter_id', owner.id);

    if ((remaining || 0) === 0) {
      await db.from('waitlist_users').delete().eq('id', owner.id);
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Leave error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
