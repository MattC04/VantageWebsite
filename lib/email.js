// Email sending via EmailJS REST API (server-side, keys in env vars)
// EmailJS Public Key:  process.env.EMAILJS_PUBLIC_KEY
// EmailJS Service ID:  process.env.EMAILJS_SERVICE_ID
// EmailJS Template IDs:
//   Waitlist confirm:  process.env.EMAILJS_TEMPLATE_WAITLIST  (existing template)
//   Verification:      process.env.EMAILJS_TEMPLATE_VERIFY    (new template — see README)

const EMAILJS_API = 'https://api.emailjs.com/api/v1.0/email/send';

async function sendEmail(templateId, templateParams) {
  const body = {
    service_id:  process.env.EMAILJS_SERVICE_ID,
    template_id: templateId,
    user_id:     process.env.EMAILJS_PUBLIC_KEY,
    accessToken: process.env.EMAILJS_PRIVATE_KEY, // EmailJS private key for server calls
    template_params: templateParams,
  };

  const res = await fetch(EMAILJS_API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`EmailJS error ${res.status}: ${text}`);
  }
  return true;
}

// Send verification email with a confirm link
export async function sendVerificationEmail({ toEmail, toName, verifyUrl }) {
  return sendEmail(process.env.EMAILJS_TEMPLATE_VERIFY, {
    to_email:   toEmail,
    to_name:    toName,
    verify_url: verifyUrl,
  });
}

// Send the existing waitlist welcome email
export async function sendWaitlistWelcome({ toEmail, toName }) {
  return sendEmail(process.env.EMAILJS_TEMPLATE_WAITLIST, {
    to_email: toEmail,
    to_name:  toName,
  });
}
