# Owlet x 5SIM x Paystack Platform — PRD + Execution Playbook

**Document Owner:** Founding Product + Engineering Team  
**Version:** v1.0  
**Date:** 2026-04-17  
**Status:** Ready for implementation

---

## 1) Executive Summary (Straight + Minimal)

Build a **B2C web platform** where users can:
1. Fund wallet / pay via **Paystack**.
2. Rent virtual numbers via **5sim.net**.
3. Access and manage SMM services via **the-owlet.com / outlet.ng integration layer**.

Ship quickly with a **serverless-first architecture on Vercel**, **Vite frontend**, **Clerk auth**, **Resend email**. Prioritize reliability, transparent pricing, trust, and fast support over visual complexity.

**Positioning:** “Fast, trusted digital utility platform for OTP numbers + SMM services with instant payments.”

---

## 2) Product Goals and Non-Goals

### Goals (first 90 days)
- Enable sign-up, identity-lite onboarding, wallet funding, purchase flow, and delivery status for two core products:
  - 5SIM number rental
  - Owlet-powered SMM orders
- Maintain successful payment + fulfillment reconciliation > 99%.
- Reach first 1,000 transacting users with strong repeat behavior.
- Keep ops headcount low via automation and clear runbooks.

### Non-Goals (v1)
- No native mobile app.
- No social feed/community.
- No advanced BI suite (basic analytics only).
- No multi-country legal expansion beyond initial operating market until compliance baseline is stable.

---

## 3) Target Users & JTBD

### Segments
1. **Digital hustlers / solo operators** needing OTP numbers quickly.
2. **SMBs and micro-agencies** buying SMM services regularly.
3. **Power users** who need speed, uptime, and transaction history.

### Jobs To Be Done
- “When I need a number immediately, I want to rent one in seconds and receive OTP reliably.”
- “When I need social growth services, I want simple package purchase and visible order progress.”
- “When I pay, I need instant confirmation and no ambiguity.”

---

## 4) Product Scope (MVP)

### Core Modules
1. **Auth + Accounts (Clerk)**
   - Email/phone auth, session management, basic profile.
2. **Wallet + Payments (Paystack)**
   - Fund wallet, transaction ledger, webhook-based reconciliation.
3. **5SIM Integration**
   - Catalog browsing (country/service/operator)
   - Number rent flow
   - OTP retrieval status
   - Cancellations/timeouts handling
4. **Owlet/Outlet Integration (SMM)**
   - Service catalog sync
   - Place order
   - Order status polling/webhook mapping
5. **Customer Dashboard**
   - Wallet balance
   - Active rentals and SMM orders
   - Transaction history
6. **Notifications (Resend email)**
   - Payment success/failure
   - Order status updates
   - Support ticket updates
7. **Admin Console (internal)**
   - User lookup
   - Manual credits/debits with audit trail
   - Provider health status and incident switches

---

## 5) Key User Flows

### Flow A: New user to first purchase (north-star)
1. User lands on homepage.
2. User signs up (Clerk).
3. User funds wallet (Paystack checkout).
4. Paystack webhook confirms transaction.
5. Wallet updates atomically.
6. User selects product (5SIM or SMM).
7. Platform reserves funds and sends provider request.
8. Response + tracking shown in dashboard.
9. Email receipt and status notices via Resend.

### Flow B: Failure handling
- Payment succeeded but callback delay: show "pending reconciliation" state.
- Provider timeout: auto-retry with idempotency key.
- Fulfillment fail after debit: auto-refund to wallet.
- Notify user with plain-language reason and next step.

---

## 6) Functional Requirements (Detailed)

### 6.1 Authentication & User Management
- Clerk-managed auth + session tokens.
- Role types: `customer`, `admin`, `support`.
- Risk checks:
  - velocity limits for signups and purchases
  - optional phone verification for high-risk actions

### 6.2 Wallet & Ledger
- Wallet is an internal ledger, not stored value bank substitute.
- All balance mutations are append-only ledger entries:
  - `credit`, `debit`, `refund`, `adjustment`
- Every mutation linked to source event (`paystack_txn_id`, `provider_order_id`, etc.).
- Strict idempotency on callbacks and internal mutation commands.

### 6.3 Paystack
- Use hosted checkout for MVP.
- Verify transactions server-side before crediting wallet.
- Webhook endpoint with signature verification.
- States:
  - `initiated`, `pending`, `success`, `failed`, `reconciled`
- Daily reconciliation job compares local ledger vs Paystack records.

### 6.4 5SIM
- Pull available products and pricing periodically (cache layer).
- Reserve/rent number endpoint integration.
- OTP polling with exponential backoff.
- Timeout/cancel logic with user-visible countdown.
- Revenue control:
  - configurable markup per country/service/operator

### 6.5 Owlet/Outlet SMM
- Normalize provider catalog into internal schema.
- Order submission with idempotency token.
- Status sync with periodic polling + optional webhook bridge.
- Surface statuses in plain terms:
  - queued, processing, partial, completed, failed, refunded

### 6.6 Notifications (Resend)
- Transactional templates:
  - welcome
  - payment confirmation
  - order placed
  - order update
  - refund issued
- Retries and dead-letter queue for failed sends.

### 6.7 Admin & Operations
- Search by user, transaction, provider order id.
- Manual action controls require reason + actor id.
- Incident kill-switches:
  - disable new orders per provider
  - disable payment method
- Audit logs immutable.

---

## 7) Non-Functional Requirements

- **Availability:** 99.5% (MVP target).
- **P95 API latency:** < 500ms for internal APIs (excluding external provider latency).
- **Security:** signed webhooks, encrypted secrets, least-privilege access.
- **Scalability:** serverless autoscaling on Vercel.
- **Observability:** logs, metrics, traces, alerting on failures/spikes.

---

## 8) Recommended Technical Architecture (Vercel-first)

### Frontend
- **Vite + React + TypeScript**
- UI: minimal component system (Tailwind + accessible primitives)
- State: TanStack Query for server state + small local store for UI state

### Backend (Serverless)
- **Vercel Functions / Route Handlers** (Node runtime)
- Service boundaries:
  - `auth-service` (via Clerk SDK wrappers)
  - `wallet-service`
  - `payment-service`
  - `5sim-service`
  - `smm-service`
  - `notification-service`

### Data
- **Postgres (Neon/Supabase/PlanetScale equivalent with Postgres preferred)**
- ORM: Prisma or Drizzle
- Tables:
  - users
  - wallets
  - ledger_entries
  - payment_transactions
  - number_orders
  - smm_orders
  - provider_events
  - email_events
  - admin_actions

### Queues / Async
- Use Upstash QStash or Vercel Cron + queue pattern for:
  - retries
  - reconciliation
  - status polling
  - outbound email retries

### Integrations
- Clerk (auth)
- Paystack (payment)
- 5SIM (numbers)
- Owlet/Outlet API adapter (SMM)
- Resend (emails)

### Security Baseline
- Zod validation for all external inputs.
- Rate limiting per IP + user + endpoint.
- Webhook signature validation.
- Secret rotation policy every 60 days.
- No API keys in frontend; only server-side calls.

---

## 9) API Design (MVP endpoints)

### Public app API
- `POST /api/wallet/fund/initiate`
- `POST /api/payments/paystack/webhook`
- `GET /api/wallet/balance`
- `GET /api/wallet/transactions`
- `GET /api/5sim/catalog`
- `POST /api/5sim/orders`
- `GET /api/5sim/orders/:id`
- `POST /api/smm/orders`
- `GET /api/smm/orders/:id`
- `GET /api/dashboard/summary`

### Admin API
- `GET /api/admin/users/:id`
- `POST /api/admin/wallet/adjust`
- `POST /api/admin/providers/:name/toggle`

**Design rules:** idempotency key required for all purchase/order creation endpoints.

---

## 10) Data Model (High-level)

- `users(id, clerk_id, email, phone, role, status, created_at)`
- `wallets(id, user_id, currency, balance_snapshot, updated_at)`
- `ledger_entries(id, wallet_id, type, amount, currency, reference_type, reference_id, idempotency_key, created_at)`
- `payment_transactions(id, user_id, provider='paystack', provider_txn_id, amount, status, raw_payload, created_at)`
- `number_orders(id, user_id, provider_order_id, service, country, cost, price_charged, status, otp_code, expires_at, created_at)`
- `smm_orders(id, user_id, provider_order_id, service_id, quantity, cost, price_charged, status, external_status, created_at)`
- `provider_events(id, provider, event_type, payload, processed_at, status)`
- `admin_actions(id, actor_user_id, action_type, target_id, reason, metadata, created_at)`

---

## 11) Pricing, Unit Economics, and Controls

### Pricing Strategy (simple)
- Wallet top-up minimum.
- Dynamic markup rules:
  - 5SIM: per country/service/operator band
  - SMM: per service category
- Display all-inclusive final price before checkout.

### Unit Economics
- Track gross margin per order.
- Alert if margin < threshold.
- Separate CAC by channel and monitor payback period.

### Fraud/Abuse Controls
- Velocity limits on wallet funding and order frequency.
- Flag mismatched geo/device/payment behavior.
- Temporary hold and manual review pipeline for anomalies.

---

## 12) Compliance & Risk (Pragmatic MVP)

- Terms of service clearly define usage boundaries and refund policy.
- Privacy policy includes provider data processing.
- Retain minimal PII.
- Encrypt sensitive records at rest and in transit.
- Keep immutable audit trail for financial actions.
- Validate regional legal requirements before scaling market coverage.

---

## 13) Branding System (Minimal + High-Agency)

### Brand Core
- **Name candidate:** “RelayDesk” (can be replaced)
- **Promise:** “Get numbers, run social orders, and pay instantly.”
- **Voice:** blunt, clear, no hype.
- **Visual style:** clean typography, low-motion UI, high contrast, obvious CTAs.

### Messaging Pillars
1. Speed you can measure.
2. Transparent pricing.
3. Reliable support and refunds.

### Design Tokens (starter)
- Primary: `#111827`
- Accent: `#2563EB`
- Success: `#16A34A`
- Warning: `#D97706`
- Error: `#DC2626`
- Typeface: Inter / system stack

---

## 14) Team Blueprint (Lean)

### Core Team (0→1)
- Product Lead / Founder (1)
- Full-stack Engineer (2)
- Growth Operator (1)
- Customer Support (1, part-time initially)
- Finance/Ops (fractional)

### Cadence
- Daily 20-min standup
- Weekly KPI review
- Bi-weekly roadmap adjustment based on data

---

## 15) Roadmap: Zero → 100

### Phase 0 (Week 1): Foundation
- Repo setup, CI/CD, env handling, schema, auth scaffold.
- Integrations sandbox smoke tests.

### Phase 1 (Weeks 2-3): Transaction Core
- Wallet + Paystack flow end-to-end.
- 5SIM order MVP with status.
- Basic dashboard.

### Phase 2 (Weeks 4-5): SMM + Ops
- Owlet/Outlet order flow.
- Admin tools, incident controls, audit logs.
- Notification system (Resend).

### Phase 3 (Week 6): Hardening + Launch
- Reconciliation jobs, retries, monitoring, load tests.
- Security checks, legal pages, support SOP.
- Closed beta + bug bash.

### Phase 4 (Weeks 7-8): GTM Acceleration
- Public launch.
- Referral loops, channel experiments, retention campaigns.

---

## 16) Go-To-Market Strategy (Execution-first)

### Channel Stack (first 60 days)
1. Community channels (Telegram/WhatsApp/X) with direct founder presence.
2. Micro-influencers in digital hustle/SMM niches.
3. Affiliate/referral model with trackable codes.
4. SEO pages for long-tail intent (service + country queries).

### Offer Strategy
- New-user credit on first successful top-up.
- Fast-support guarantee (response SLA banner).
- Transparent refund policy as conversion lever.

### Activation Metrics
- Time to first transaction (TTFT)
- Signup → funded wallet conversion
- Funded wallet → first order conversion
- Week-1 repeat transaction rate

### Retention Loops
- Low-balance reminders.
- Service availability alerts.
- Win-back email sequences via Resend.

---

## 17) KPI Tree

### North Star
- Weekly successful order volume (paid + fulfilled).

### Supporting KPIs
- Payment success rate
- Reconciliation discrepancy rate
- OTP delivery success rate
- SMM completion rate
- Refund rate
- Repeat purchase rate (D7/D30)
- Support first-response time

---

## 18) Analytics Events (must implement)

- `signup_completed`
- `wallet_fund_initiated`
- `wallet_fund_succeeded`
- `wallet_fund_failed`
- `number_order_created`
- `number_order_otp_received`
- `smm_order_created`
- `smm_order_completed`
- `refund_issued`
- `support_ticket_created`

Each event includes: `user_id`, `timestamp`, `amount` (if relevant), `provider`, `country`, `service`, `status`.

---

## 19) QA & Release Checklist

- Unit tests for pricing, ledger mutation rules, status mapping.
- Integration tests for Paystack webhook verification and idempotency.
- Contract tests for 5SIM/Owlet adapters.
- E2E for signup → fund → purchase → completion/refund.
- Load test critical endpoints before launch.

---

## 20) Agent Prompts to Start Development Immediately

### Prompt 1 — System Architect Agent
```md
You are the lead architect. Generate a production-ready monorepo plan for a Vite + React + TypeScript frontend and Vercel serverless backend integrating Clerk, Paystack, 5SIM, Owlet/Outlet APIs, and Resend.
Output:
1) folder structure
2) service boundaries
3) API contracts
4) data schema with migrations
5) security controls
6) phased implementation tickets (2-week sprints)
Constraints: minimalism, high reliability, no overengineering, all provider secrets server-side only.
```

### Prompt 2 — Backend Implementation Agent
```md
Build backend MVP endpoints and services for wallet ledger, Paystack webhook reconciliation, 5SIM number ordering, Owlet/Outlet SMM ordering, and Resend notifications.
Requirements:
- idempotency keys on all write endpoints
- signature verification for webhooks
- append-only ledger model
- retries and dead-letter handling for external API calls
- comprehensive structured logs
Return:
- code
- migration files
- tests
- .env.example
- runbook for local and Vercel deploy
```

### Prompt 3 — Frontend Product Agent
```md
Create a minimal, conversion-first frontend using Vite + React + TypeScript + Tailwind.
Pages:
- landing
- sign in/up (Clerk)
- wallet funding
- 5SIM catalog + buy flow
- SMM services + order flow
- dashboard with order and payment history
Constraints:
- clear hierarchy, low-motion UI, no visual noise
- optimistic but safe status updates
- responsive and accessible
Return with component map and route-level loading/error states.
```

### Prompt 4 — QA/Release Agent
```md
Create test plan and automated suite for high-risk flows:
- payment init + webhook reconcile
- wallet balance consistency under retries
- 5SIM rent + OTP fetch timeout/refund
- SMM order lifecycle states
- role-based admin controls
Deliver CI pipeline gates and a launch readiness report template.
```

### Prompt 5 — Growth Agent
```md
Generate a 45-day GTM execution board for this platform.
Include:
- channel experiments (owned/community/influencer/referral)
- weekly budgets
- expected CAC bands
- creative hooks and landing copy variants
- daily metric dashboard schema
Optimize for first 1,000 paying users, high repeat usage, and low support overhead.
```

---

## 21) Immediate Execution Backlog (First 30 tasks)

1. Create mono-repo baseline with app + api packages.
2. Setup TypeScript strict mode and lint/format hooks.
3. Add Clerk auth and protected routes.
4. Create Postgres schema and migration pipeline.
5. Implement ledger primitives and balance computation.
6. Implement Paystack transaction initialize endpoint.
7. Implement Paystack webhook verifier endpoint.
8. Add idempotency middleware.
9. Add payment reconciliation cron.
10. Build wallet funding UI.
11. Build transaction history UI.
12. Add 5SIM catalog sync worker.
13. Build 5SIM catalog UI.
14. Implement 5SIM order endpoint.
15. Implement OTP status polling worker.
16. Add timeout + auto-refund logic.
17. Build Owlet catalog adapter.
18. Implement SMM order endpoint.
19. Build SMM order status sync worker.
20. Create dashboard summary endpoint.
21. Build dashboard widgets.
22. Integrate Resend templates and notification service.
23. Add support contact form + ticket routing.
24. Implement admin login role gate.
25. Build admin wallet adjustment tool with audit logs.
26. Add provider kill-switch controls.
27. Add rate limiting and abuse detection rules.
28. Add structured logging and error observability.
29. Write integration and E2E tests.
30. Prepare beta launch checklist and incident SOPs.

---

## 22) One-Page SOPs (Operations)

### Incident SOP
- Detect alert → classify severity → disable affected provider route if needed → notify users in-app/email → resolve → backfill/reconcile → publish postmortem.

### Refund SOP
- Trigger type (auto/manual) → verify transaction and provider status → execute ledger credit entry → send confirmation email → log admin action.

### Support SOP
- First response < 15 minutes during business hours.
- Use decision macros: payment issue, OTP issue, SMM issue, account issue.
- Escalate technical incidents with ticket priority matrix.

---

## 23) Definition of Done (MVP Launch)

- End-to-end successful transaction flow across both product lines.
- Automated reconciliation and refund guardrails in place.
- Core KPIs instrumented and visible.
- Support + incident playbooks active.
- Legal pages and policies published.
- Beta users transacting with stable repeat behavior.

---

## 24) Final Notes

- Keep every user-facing message concrete and operational.
- Prefer shipping a narrower stable scope over broad unstable features.
- Trust is the product: speed + transparency + reliable money handling.
