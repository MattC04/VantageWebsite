import { getServiceClient } from '../../../lib/supabase';
import { rateLimit } from '../../../lib/utils';

export const config = { api: { bodyParser: { sizeLimit: '4kb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!rateLimit(`leave:ip:${ip}`, 10, 60_000)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
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
