import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return res.status(500).json({ ok: false, message: 'Missing RESEND_API_KEY or EMAIL_FROM.' });
  }

  const { to } = req.body as { to?: string };

  if (!to) {
    return res.status(400).json({ ok: false, message: 'Missing target email address in body { to }.' });
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to,
    subject: 'Owlet Connect deploy verification',
    html: '<p>Resend is configured correctly on Vercel.</p>',
  });

  return res.status(200).json({ ok: true, id: result.data?.id ?? null });
}
