import { Resend } from 'resend';

let _resend = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export async function sendWaitlistWelcome({ toEmail, toName }) {
  const { error } = await getResend().emails.send({
    from: process.env.RESEND_FROM || 'Vantage <noreply@vantagedfs.com>',
    to: toEmail,
    subject: "You're on the Vantage waitlist",
    template_id: 'beta-access-confirmed',
    params: { to_name: toName },
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return true;
}
