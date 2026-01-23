import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const requiredEnv = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SES_FROM_EMAIL'];

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

export async function sendEmailSES({ to, subject, text, html }) {
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

  const client = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const params = {
    Destination: {
      ToAddresses: recipients,
    },
    Message: {
      Subject: {
        Data: String(subject),
      },
      Body: {
        Text: {
          Data: String(text),
        },
      },
    },
    Source: process.env.AWS_SES_FROM_EMAIL,
  };

  if (html && String(html).trim()) {
    params.Message.Body.Html = {
      Data: String(html),
    };
  }

  try {
    const response = await client.send(new SendEmailCommand(params));
    return { ok: true, messageId: response?.MessageId || null };
  } catch (err) {
    console.error('SES send failed:', err?.message || err);
    throw err;
  }
}
