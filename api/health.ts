import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    ok: true,
    service: 'owlet-connect',
    timestamp: new Date().toISOString(),
  });
}
