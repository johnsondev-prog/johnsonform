# Owlet Connect Starter (Vercel-ready)

Minimal Vite + React frontend with Vercel serverless API routes for provider integrations.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Vercel deployment

1. Import repository in Vercel.
2. Ensure build command is `npm run build`.
3. Configure all environment variables from `.env.example`.
4. Deploy.

## Post-deploy smoke checks

- `GET /api/health` should return 200.
- `GET /api/env-check` should return 200 once env vars are set.
- `POST /api/send-test-email` with JSON body `{ "to": "you@example.com" }` should send a message.
