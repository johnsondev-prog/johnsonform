# Platform PRD — Owlet + Paystack + 5SIM B2C (V1)

## 1) Product Overview

**Working name:** Owlet Connect  
**One-liner:** A minimal, high-agency web platform where users fund wallets, rent temporary phone numbers, and manage SMM services from one dashboard.

### Problem
Users currently juggle separate services for:
1. funding and payment flows,
2. temporary phone number rental,
3. SMM campaign/service management.

This creates friction, low trust, and fragmented support.

### Solution
A unified B2C platform that:
- accepts and verifies payments via **Paystack**,
- rents and tracks temporary numbers via **5SIM**,
- exposes SMM catalog/order/account operations via **the-owlet.com / outlet.ng APIs**,
- uses **Clerk** for auth and account security,
- uses **Resend** for transactional emails,
- runs on **Vite + Vercel serverless** with strict API-key isolation.

---

## 2) Goals, Non-Goals, Success Metrics

### Goals (V1)
- Fast onboarding: user can sign up and make first successful transaction in < 5 minutes.
- Zero API secrets in client code.
- Unified wallet + transaction ledger.
- Deliver first revenue within 2 weeks of launch.

### Non-Goals (V1)
- Native mobile apps.
- Complex enterprise RBAC.
- Deep BI dashboards.
- Multi-country tax automation.

### Success Metrics (first 90 days)
- Activation rate (signup → first funded wallet): **>35%**.
- First order conversion (funded → first order): **>45%**.
- Failed transaction rate: **<3%**.
- Mean support response time: **<10 minutes** during business hours.
- 30-day repeat purchase rate: **>25%**.

---

## 3) Users & Jobs-To-Be-Done

### Primary Persona
**Digital operators / creators / small agencies** who need numbers + SMM services quickly and repeatedly.

### JTBD
- “When I need to verify or run campaigns quickly, I want to rent numbers and purchase SMM services in one place, so I can execute without platform-hopping.”

### Key User Stories
1. As a new user, I want to sign up securely and verify my email quickly.
2. As a user, I want to fund my wallet with local payment methods.
3. As a user, I want to browse/rent numbers by country/service and receive SMS updates.
4. As a user, I want to browse SMM catalog and place orders from my wallet.
5. As a user, I want a complete history of orders, payments, and refunds.
6. As support/admin, I want to resolve failed orders and refund safely.

---

## 4) Feature Scope

## V1 Core Features
1. **Authentication & Identity (Clerk)**
   - Email/password + social login (optional)
   - Email verification
   - Session/device controls
2. **Wallet & Payments (Paystack)**
   - Add funds
   - Webhook verification
   - Wallet ledger entries
3. **5SIM Number Rental**
   - Search inventory (country/service/price)
   - Rent number
   - Poll or webhook for SMS status updates
   - Timeout + cancellation handling
4. **SMM Operations (Owlet APIs)**
   - Service list sync
   - Place order
   - Order status tracking
5. **User Dashboard**
   - Balance card
   - Recent transactions
   - Active rentals / active SMM orders
6. **Notifications (Resend)**
   - Payment success/failure
   - Number rental success/timeout
   - Order accepted/completed/failed
7. **Admin Console (minimal)**
   - User lookup
   - Manual wallet adjustments (audited)
   - Order retry/refund actions

### V1.1 Add-ons
- Referral codes
- Promo campaigns
- Support chat widget

---

## 5) Functional Requirements

### Auth & Account
- Must create customer profile on first login.
- Must block actions when email is unverified (except limited read-only views).

### Wallet
- Wallet balance updates only from verified events.
- Ledger is append-only (no destructive edits).
- Every debit/credit links to external reference ID.

### Payments (Paystack)
- Initialize payment transaction server-side.
- Verify transactions via webhook signature + callback verification.
- Idempotency keys for webhook replay protection.

### Number Rental (5SIM)
- Fetch offers with caching (30–60 seconds TTL).
- Reserve/rent number with explicit expiration timestamp.
- Auto-close stale sessions.

### SMM Orders (Owlet)
- Fetch services daily + manual refresh option.
- Place order only if wallet has sufficient balance.
- Persist external order IDs and status mapping.

### Notifications
- Email templates must include transaction/order reference IDs.
- System should retry failed email delivery.

### Auditability
- Log all external API requests (sanitized).
- Log all mutable admin actions with actor + timestamp.

---

## 6) Non-Functional Requirements

- **Security:** API keys only in Vercel environment variables; no key leakage to client.
- **Performance:** P95 API response < 800ms for internal endpoints (excluding provider latency).
- **Availability:** 99.5% monthly target for core transaction flows.
- **Scalability:** serverless autoscaling on Vercel.
- **Reliability:** all money movements are idempotent and fully traceable.
- **Compliance:** baseline privacy policy + terms + abuse policy before launch.

---

## 7) Information Architecture & Main Flows

### Navigation
- `/` Landing
- `/sign-in`, `/sign-up`
- `/dashboard`
- `/wallet`
- `/numbers`
- `/smm`
- `/transactions`
- `/settings`
- `/admin` (restricted)

### Critical Flow A — Fund Wallet
1. User enters amount.
2. Server creates Paystack transaction.
3. User completes checkout.
4. Paystack webhook hits `/api/webhooks/paystack`.
5. Signature verified; ledger credit created.
6. Email receipt sent.

### Critical Flow B — Rent Number
1. User filters numbers.
2. Frontend requests `/api/numbers/search`.
3. User chooses offer, clicks rent.
4. Server verifies wallet and debits.
5. Server requests 5SIM rent.
6. Rental status shown live; SMS updates appear.

### Critical Flow C — Place SMM Order
1. User selects service + parameters.
2. Server validates input and pricing.
3. Wallet debited atomically.
4. Owlet order placed.
5. Order status polling/webhook updates timeline.

---

## 8) API & Data Contracts (High-Level)

### Internal API Endpoints (Vercel Functions)
- `POST /api/wallet/top-up/initiate`
- `POST /api/webhooks/paystack`
- `GET /api/numbers/search`
- `POST /api/numbers/rent`
- `GET /api/numbers/:id/messages`
- `GET /api/smm/services`
- `POST /api/smm/orders`
- `GET /api/smm/orders/:id`
- `GET /api/transactions`

### Core Tables
- `users`
- `wallets`
- `wallet_ledger`
- `payments`
- `number_rentals`
- `number_messages`
- `smm_services`
- `smm_orders`
- `audit_logs`

---

## 9) Security Model

- Clerk handles identity/session hardening.
- Backend authorization checks on every write route.
- Signed webhook verification for Paystack.
- HMAC or token verification for other providers where available.
- Rotate API keys every 60–90 days.
- Rate limit abuse-prone routes (`/numbers/search`, `/smm/orders`).
- Encrypt sensitive columns at rest where possible.

---

## 10) Tech Stack & Architecture (Vercel-Optimized)

- **Frontend:** Vite + React + TypeScript + Tailwind (minimal UI system)
- **Auth:** Clerk
- **Email:** Resend
- **API Layer:** Vercel serverless functions (Node)
- **DB:** Postgres (Neon/Supabase/PlanetScale alternative if using MySQL)
- **Queue (optional for v1.1):** Upstash Redis + QStash for retries/polling
- **Observability:** Sentry + Vercel logs + simple health dashboard

### Architecture Principles
- Keep provider SDK logic behind repository/service adapters.
- Use an internal domain model independent of provider response shapes.
- Strong idempotency in payment and order creation flows.

---

## 11) Delivery Plan (0→100)

## Phase 0 (Day 1–2): Foundation
- Repo setup, env conventions, CI, lint/test pipeline.
- Clerk + base app shell.
- DB schema migration setup.

## Phase 1 (Day 3–5): Money In
- Paystack initialization + webhook verification.
- Wallet ledger and transaction pages.
- Resend receipt emails.

## Phase 2 (Day 6–8): Numbers
- 5SIM search/rent/status endpoints.
- Rental UI + timers + error handling.

## Phase 3 (Day 9–11): SMM
- Owlet service sync.
- SMM order create + status refresh.

## Phase 4 (Day 12–14): Hardening & Launch
- Admin micro-console.
- Monitoring, alerts, legal pages.
- Private beta + bug bash + launch.

---

## 12) Risks & Mitigation

- **Provider API instability:** add retries + circuit-breaker pattern.
- **Fraud/abuse:** velocity checks, minimum KYC for high-volume users.
- **Webhook issues:** replay-safe idempotent handlers, dead-letter logging.
- **Support overload:** in-app help center + macro responses + status page.

---

## 13) Launch Checklist

- [ ] Production env vars configured in Vercel.
- [ ] Webhooks configured and signature-tested.
- [ ] Test cards + live small-value transactions validated.
- [ ] Error monitoring and alert routing active.
- [ ] Privacy Policy + Terms + Refund policy published.
- [ ] Admin runbook documented.
- [ ] Incident response template ready.

---

## 14) Minimal KPIs Dashboard

- Daily: signups, funded users, first order count, GMV, failed payment count.
- Weekly: CAC estimate, repeat buyer %, support ticket volume.
- Monthly: net revenue, churn, top services, country distribution.
