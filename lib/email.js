import { Resend } from 'resend';

let _resend = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

function buildWaitlistHtml(toName) {
  return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Vantage — Welcome to the Waitlist</title>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Barlow+Condensed:wght@700;800;900&display=swap" rel="stylesheet" />
    </head>
    <body style="margin: 0; padding: 0; background-color: #080808 !important;" bgcolor="#080808">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#080808" class="body-wrap" style="background-color: #080808 !important; padding: 48px 16px;">
            <tr>
                <td align="center" bgcolor="#080808" style="background-color: #080808 !important; padding: 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" bgcolor="#0e0c08" style="max-width: 580px; width: 100%; border-radius: 18px; border: 1px solid #f0d080; overflow: hidden; background-color: #0e0c08 !important;">
                        <tr>
                            <td align="center" bgcolor="#131008" style="background-color: #131008 !important; padding: 44px 48px 36px;">
                                <p style="margin: 0 0 28px; font-family: &quot;Barlow Condensed&quot;, &quot;Arial Narrow&quot;, Arial, sans-serif; font-size: 26px; font-weight: 900; letter-spacing: 0.04em; color: #f0d080; text-transform: uppercase; line-height: 1;">VANTAGE</p>
                                <p style="margin: 0 0 10px; font-family: &quot;Space Grotesk&quot;, &quot;Arial&quot;, sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #c9a84c;">Beta Waitlist Confirmed</p>
                                <h1 style="margin: 0; font-family: &quot;Barlow Condensed&quot;, &quot;Arial Narrow&quot;, Arial, sans-serif; font-size: 46px; font-weight: 900; letter-spacing: -0.01em; text-transform: uppercase; line-height: 1.05; color: #f5f0e8;">You're In.</h1>
                            </td>
                        </tr>
                        <tr><td bgcolor="#0e0c08" style="background-color: #0e0c08 !important; padding: 0 48px;"><div style="height: 1px; background-color: #1e1a10;"></div></td></tr>
                        <tr>
                            <td bgcolor="#0e0c08" style="background-color: #0e0c08 !important; padding: 36px 48px 12px;">
                                <p style="margin: 0 0 8px; font-family: &quot;Space Grotesk&quot;, &quot;Arial&quot;, sans-serif; font-size: 15px; font-weight: 500; color: #e8e0cc; line-height: 1;">Hey <strong style="color: #f0d080;">${toName}</strong>,</p>
                                <p style="margin: 0 0 16px; font-family: &quot;Space Grotesk&quot;, &quot;Arial&quot;, sans-serif; font-size: 14px; font-weight: 400; color: #777770; line-height: 1.75;">You've officially locked in your spot on the <strong style="color: #d4cbb8; font-weight: 600;">Vantage</strong> beta waitlist. We're building the best sports betting platform in the game — squad rooms to sweat parlays with your crew, live parlay updates so you never miss a beat, player cards that earn you real rewards, daily packs loaded with promos, and a progression system that makes every bet part of something bigger.</p>
                                <p style="margin: 0 0 32px; font-family: &quot;Space Grotesk&quot;, &quot;Arial&quot;, sans-serif; font-size: 14px; font-weight: 400; color: #777770; line-height: 1.75;">When we go live, you'll be the first through the door. Before the public. Keep an eye out for us in your inbox. <strong style="color: #d4cbb8; font-weight: 600;">Your early access invite is on its way.</strong></p>
                            </td>
                        </tr>
                        <tr>
                            <td bgcolor="#0e0c08" style="background-color: #0e0c08 !important; padding: 0 48px 36px;">
                                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px"><tr><td width="26" valign="middle" bgcolor="#0e0c08" style="background-color: #0e0c08 !important;"><span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; border-radius: 50%; background-color: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.3); font-size: 12px; color: #c9a84c; font-family: Arial, sans-serif;">&#10003;</span></td><td bgcolor="#0e0c08" style="background-color: #0e0c08 !important; padding-left: 12px; font-family: &quot;Space Grotesk&quot;, &quot;Arial&quot;, sans-serif; font-size: 14px; font-weight: 500; color: #c8c0ac; line-height: 1.5;">Free credits to bet with on launch</td></tr></table>
                                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px"><tr><td width="26" valign="middle" bgcolor="#0e0c08" style="background-color: #0e0c08 !important;"><span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; border-radius: 50%; background-color: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.3); font-size: 12px; color: #c9a84c; font-family: Arial, sans-serif;">&#10003;</span></td><td bgcolor="#0e0c08" style="background-color: #0e0c08 !important; padding-left: 12px; font-family: &quot;Space Grotesk&quot;, &quot;Arial&quot;, sans-serif; font-size: 14px; font-weight: 500; color: #c8c0ac; line-height: 1.5;">Squad rooms &amp; exclusive player cards</td></tr></table>
                                <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td width="26" valign="middle" bgcolor="#0e0c08" style="background-color: #0e0c08 !important;"><span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; border-radius: 50%; background-color: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.3); font-size: 12px; color: #c9a84c; font-family: Arial, sans-serif;">&#10003;</span></td><td bgcolor="#0e0c08" style="background-color: #0e0c08 !important; padding-left: 12px; font-family: &quot;Space Grotesk&quot;, &quot;Arial&quot;, sans-serif; font-size: 14px; font-weight: 500; color: #c8c0ac; line-height: 1.5;">Massive promos &amp; drops every day</td></tr></table>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" bgcolor="#0e0c08" style="background-color: #0e0c08 !important; padding: 8px 48px 40px;">
                                <a href="https://vantagedfs.com" style="text-decoration: none; display: inline-block;">
                                    <img src="https://vantagedfs.com/Logo.png" alt="VANTAGE" width="52" style="display: block; border: 0;" />
                                </a>
                            </td>
                        </tr>
                        <tr><td bgcolor="#0e0c08" style="background-color: #0e0c08 !important; padding: 0 48px;"><div style="height: 1px; background-color: #1e1a10;"></div></td></tr>
                        <tr>
                            <td bgcolor="#0a0906" style="background-color: #0a0906 !important; padding: 22px 48px 30px;">
                                <p style="margin: 0 0 3px; font-family: &quot;Space Grotesk&quot;, &quot;Arial&quot;, sans-serif; font-size: 11px; color: #333328; line-height: 1.6;">You received this because you joined the waitlist at vantagedfs.com.</p>
                                <p style="margin: 0; font-family: &quot;Space Grotesk&quot;, &quot;Arial&quot;, sans-serif; font-size: 11px; color: #2c2c24; line-height: 1.6;">&copy; 2026 Vantage. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>`;
}

export async function sendWaitlistWelcome({ toEmail, toName }) {
  const { error } = await getResend().emails.send({
    from: process.env.RESEND_FROM || 'Vantage <noreply@vantagedfs.com>',
    to: toEmail,
    subject: "You're on the Vantage waitlist",
    html: buildWaitlistHtml(toName),
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return true;
}
