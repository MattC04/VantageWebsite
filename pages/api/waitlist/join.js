import { getServiceClient } from "../../../lib/supabase";
import {
  generateShareCode,
  normalizeEmail,
  isValidEmail,
  rateLimit,
} from "../../../lib/utils";
import { sendWaitlistWelcome } from "../../../lib/email";

export const config = { api: { bodyParser: { sizeLimit: "4kb" } } };
const ROOM_CAPACITY = 8;
const MAX_REFERRALS = ROOM_CAPACITY - 1;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    "unknown";

  if (!rateLimit(`join:ip:${ip}`, 5, 60_000)) {
    return res
      .status(429)
      .json({ error: "Too many requests. Please wait a moment." });
  }

  const { email, share_code: refCode } = req.body || {};

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required." });
  }

  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    return res
      .status(400)
      .json({ error: "Please enter a valid email address." });
  }

  if (!rateLimit(`join:email:${normalizedEmail}`, 3, 60_000)) {
    return res.status(429).json({ error: "Too many requests for this email." });
  }

  const db = getServiceClient();
  const isReferral = !!(refCode && typeof refCode === "string");

  try {
    // Find or create the user
    const { data: existing } = await db
      .from("waitlist_users")
      .select("id, share_code")
      .eq("email", normalizedEmail)
      .maybeSingle();

    let userId, shareCode;

    if (existing) {
      userId = existing.id;
      shareCode = existing.share_code;
    } else {
      // Direct join gets a share_code (room owner), referral join does not
      let newCode = null;
      if (!isReferral) {
        for (let i = 0; i < 10; i++) {
          newCode = generateShareCode();
          const { data: collision } = await db
            .from("waitlist_users")
            .select("id")
            .eq("share_code", newCode)
            .maybeSingle();
          if (!collision) break;
        }
      }

      const { data: newUser, error: insertErr } = await db
        .from("waitlist_users")
        .insert({ email: normalizedEmail, share_code: newCode, ip_first: ip })
        .select("id, share_code")
        .single();

      if (insertErr) throw insertErr;
      userId = newUser.id;
      shareCode = newUser.share_code;

      // Send welcome email to new users (fire-and-forget, don't block response)
      // For referral joins newCode is null — use refCode (the room they're joining) as the squad URL
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vantage.com";
      const emailSquadCode = isReferral ? refCode : newCode;
      sendWaitlistWelcome({
        toEmail: normalizedEmail,
        toName: normalizedEmail.split("@")[0],
        squadUrl: `${baseUrl}/squad/${emailSquadCode}`,
      }).catch((err) => console.error("Email send error:", err));
    }

    if (isReferral) {
      // Find the room owner by their share_code
      const { data: owner } = await db
        .from("waitlist_users")
        .select("id")
        .eq("share_code", refCode)
        .maybeSingle();

      if (!owner) {
        return res.status(404).json({ error: "Squad not found." });
      }

      if (owner && owner.id !== userId) {
        // Remove from any existing room first
        const { data: existingRef } = await db
          .from("referrals")
          .select("id, inviter_id")
          .eq("invitee_id", userId)
          .maybeSingle();

        if (existingRef) {
          if (existingRef.inviter_id === owner.id) {
            // Already in this room
            return res.status(200).json({ share_code: refCode });
          }

          const { count: ownerCountBefore } = await db
            .from("referrals")
            .select("id", { count: "exact", head: true })
            .eq("inviter_id", owner.id);

          if ((ownerCountBefore || 0) >= MAX_REFERRALS) {
            return res.status(409).json({ error: "This squad room is full." });
          }

          const oldInviterId = existingRef.inviter_id;
          await db.from("referrals").delete().eq("id", existingRef.id);

          const { count: remaining } = await db
            .from("referrals")
            .select("id", { count: "exact", head: true })
            .eq("inviter_id", oldInviterId);

          if ((remaining || 0) === 0) {
            await db.from("waitlist_users").delete().eq("id", oldInviterId);
          }
        } else {
          const { count: ownerCountBefore } = await db
            .from("referrals")
            .select("id", { count: "exact", head: true })
            .eq("inviter_id", owner.id);

          if ((ownerCountBefore || 0) >= MAX_REFERRALS) {
            return res.status(409).json({ error: "This squad room is full." });
          }
        }

        await db
          .from("referrals")
          .insert({ inviter_id: owner.id, invitee_id: userId });
      }

      // Always redirect referral joins to the owner's room
      return res.status(200).json({ share_code: refCode });
    }

    return res.status(200).json({ share_code: shareCode });
  } catch (err) {
    console.error("Join error:", err);
    return res
      .status(500)
      .json({ error: "Something went wrong. Please try again." });
  }
}
