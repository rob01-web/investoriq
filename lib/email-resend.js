const requiredEnv = ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'];

const assertEnv = () => {
  for (const key of requiredEnv) {
    const value = process.env[key];
    if (!value || !String(value).trim()) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }
};

const normalizeRecipients = (to) => {
  if (!to) return [];
  if (Array.isArray(to)) return to.filter(Boolean).map((email) => String(email).trim()).filter(Boolean);
  return [String(to).trim()].filter(Boolean);
};

export async function sendEmailResend({ to, subject, text, html }) {
  assertEnv();

  const recipients = normalizeRecipients(to);
  if (recipients.length === 0) {
    throw new Error('Missing required "to" email address');
  }
  if (!subject || !String(subject).trim()) {
    throw new Error('Missing required "subject"');
  }
  if (!text || !String(text).trim()) {
    throw new Error('Missing required "text"');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: recipients,
      subject: String(subject),
      text: String(text),
      ...(html && String(html).trim() ? { html: String(html) } : {}),
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `Resend send failed (${response.status})`;
    console.error('Resend send failed:', message);
    throw new Error(message);
  }

  return { ok: true, messageId: payload?.id || null };
}
