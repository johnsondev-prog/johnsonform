# Technical Infrastructure Spec (Vite + Clerk + Resend + Vercel)

## 1) Deployment Topology

- **Frontend:** Vercel static hosting for Vite build output.
- **Backend:** Vercel serverless functions (`/api/*`).
- **Database:** Managed Postgres with connection pooling.
- **Auth:** Clerk hosted auth.
- **Email:** Resend transactional API.
- **Observability:** Sentry + Vercel runtime logs.

---

## 2) Recommended Repo Structure

```txt
/
  src/
    app/
    components/
    features/
    lib/
  api/
    wallet/
    numbers/
    smm/
    webhooks/
  db/
    schema/
    migrations/
  docs/
  tests/
```

---

## 3) Environment Variables

```bash
# App
APP_ENV=
APP_URL=

# Clerk
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Paystack
PAYSTACK_SECRET_KEY=
PAYSTACK_WEBHOOK_SECRET=

# 5SIM
FIVESIM_API_KEY=

# Owlet / Outlet
OWLET_API_KEY=
OWLET_BASE_URL=

# Resend
RESEND_API_KEY=
EMAIL_FROM=

# Database
DATABASE_URL=

# Observability
SENTRY_DSN=
```

Rules:
- Validate all required env vars on startup.
- Use separate keys per environment (dev/staging/prod).
- Never log secret values.

---

## 4) Service Adapters (Anti-Corruption Layer)

Define provider clients behind interfaces:
- `PaymentGateway` (Paystack)
- `NumberProvider` (5SIM)
- `SmmProvider` (Owlet)
- `NotificationService` (Resend)

Benefits:
- easier mocking/testing,
- provider swap flexibility,
- stable internal domain model.

---

## 5) Data Integrity Patterns

- **Idempotency:** unique keys for payment/order/rental commands.
- **Ledger-first accounting:** append-only entries.
- **Outbox pattern (optional):** ensure reliable async notifications.
- **Compensation actions:** auto-refund on downstream failure.

---

## 6) Security Controls

- Clerk middleware on protected routes.
- Role checks for admin actions.
- Signed webhook validation.
- Request rate limits (IP + user-based).
- Sanitized logs and PII minimization.

---

## 7) Reliability & Monitoring

- Health endpoint `/api/health` with provider dependency checks.
- Alerting thresholds:
  - payment webhook failures > 1% in 15 min,
  - order creation error spike,
  - sustained 5xx > baseline.
- Daily reconciliation job:
  - compare provider records with internal ledger/orders.

---

## 8) CI/CD Gates

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- Optional smoke tests against preview deployments.

Block production promotion unless all gates pass.

---

## 9) MVP Build Order (Engineering)

1. Auth + user profile bootstrap.
2. Wallet + pay-in + webhook.
3. 5SIM search/rent/message lifecycle.
4. Owlet services/orders.
5. Notifications + admin console + hardening.
