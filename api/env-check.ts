import type { VercelRequest, VercelResponse } from '@vercel/node';

const required = [
  'PAYSTACK_SECRET_KEY',
  'PAYSTACK_WEBHOOK_SECRET',
  'FIVESIM_API_KEY',
  'OWLET_API_KEY',
  'OWLET_BASE_URL',
  'RESEND_API_KEY',
  'CLERK_SECRET_KEY',
] as const;

export default function handler(_: VercelRequest, res: VercelResponse) {
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    return res.status(500).json({
      ok: false,
      missing,
      message: 'Missing required server environment variables.',
    });
  }

  return res.status(200).json({
    ok: true,
    message: 'All required server environment variables are configured.',
  });
}
