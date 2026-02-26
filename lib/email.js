const EMAILJS_API = 'https://api.emailjs.com/api/v1.0/email/send';

async function sendEmail(templateId, templateParams) {
  const body = {
    service_id:      process.env.EMAILJS_SERVICE_ID,
    template_id:     templateId,
    user_id:         process.env.EMAILJS_PUBLIC_KEY,
    accessToken:     process.env.EMAILJS_PRIVATE_KEY,
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

export async function sendWaitlistWelcome({ toEmail, toName }) {
  return sendEmail(process.env.EMAILJS_TEMPLATE_WAITLIST, {
    to_email: toEmail,
    to_name:  toName,
  });
}
