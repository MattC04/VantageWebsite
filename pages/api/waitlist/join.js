import { getServiceClient } from "../../../lib/supabase";
import {
  normalizeEmail,
  isValidEmail,
  rateLimit,
} from "../../../lib/utils";
import { sendWaitlistWelcome } from "../../../lib/email";

export const config = { api: { bodyParser: { sizeLimit: "4kb" } } };

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

  const { email } = req.body || {};

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

  try {
    const { data: existing } = await db
      .from("waitlist_users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!existing) {
      const { error: insertErr } = await db
        .from("waitlist_users")
        .insert({ email: normalizedEmail, ip_first: ip });

      if (insertErr) throw insertErr;

      sendWaitlistWelcome({
        toEmail: normalizedEmail,
        toName: normalizedEmail.split("@")[0],
      }).catch((err) => console.error("Email send error:", err));
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Join error:", err);
    return res
      .status(500)
      .json({ error: "Something went wrong. Please try again." });
  }
}
