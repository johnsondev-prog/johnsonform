# Agent Prompt Pack (Copy/Paste)

## Prompt 1 — Project Bootstrap
```md
You are the lead engineer. Build a production-ready Vite + React + TypeScript application for Vercel.
Requirements:
- Clerk auth (email verification required for transactional actions)
- Serverless API routes for all external provider calls
- Postgres schema + migrations
- Strict TypeScript + ESLint + Prettier
- Tailwind minimal design system
- CI with lint, typecheck, test
Constraints:
- No provider API key in client bundles
- Use env var validation at startup
- Add README with setup and deployment steps
Deliverables:
1) Folder structure
2) Base auth + dashboard routes
3) Health endpoint and logging middleware
4) Commit in small steps with clear messages
```

## Prompt 2 — Paystack + Wallet
```md
Implement wallet funding with Paystack.
Scope:
- POST /api/wallet/top-up/initiate
- POST /api/webhooks/paystack (signature verification mandatory)
- wallet_ledger append-only records
- idempotent webhook handling (replay-safe)
- transaction history page in dashboard
- Resend email receipt on successful credit
Acceptance:
- duplicate webhook events do not duplicate credits
- all entries linked to paystack reference IDs
- automated tests for webhook and ledger logic
```

## Prompt 3 — 5SIM Rental
```md
Implement 5SIM number rental flow.
Scope:
- GET /api/numbers/search with cache
- POST /api/numbers/rent with wallet debit + rollback on failure
- GET /api/numbers/:id/messages
- rental expiration timer and status mapping
Acceptance:
- user can search, rent, and see active rental status
- failed provider operation restores wallet state safely
- logs are sanitized and traceable by request ID
```

## Prompt 4 — Owlet SMM Integration
```md
Implement SMM services/orders integration with Owlet APIs.
Scope:
- GET /api/smm/services (sync + cache)
- POST /api/smm/orders
- GET /api/smm/orders/:id
- mapping table from provider statuses to internal statuses
Acceptance:
- wallet debit is atomic with order submission
- failed order creation triggers automatic refund ledger entry
- order timeline visible in dashboard
```

## Prompt 5 — Launch Hardening
```md
Perform launch hardening.
Checklist:
- Sentry integration for FE + API
- rate limiting on abuse-prone endpoints
- admin minimal console for refunds and user lookup
- legal pages scaffolded (terms/privacy/refund)
- runbook docs for incident response and support
Output:
- release checklist and known risks
- final production env variable matrix
- smoke-test script for post-deploy verification
```

## Prompt 6 — Growth Execution
```md
Act as growth lead and produce a 30-day GTM execution sheet.
Include:
- ICP definition and messaging variants
- channel experiments with budget and expected CAC
- onboarding lifecycle emails (via Resend)
- referral program structure
- daily/weekly KPI review template
Use a no-fluff, action-first format.
```
