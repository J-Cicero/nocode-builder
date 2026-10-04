# Platform — NoCode Builder & Microservices Platform

---

## 🚀 Guide de Démarrage Rapide (Commandes Locales)

### 1. Démarrer les Bases de Données (PostgreSQL)
Les bases de données tournent sous Docker avec leurs ports respectifs :
```bash
# Lancement des conteneurs DB IAM (5433) et Nocode Core (5434)
docker compose -f infra/docker-compose.yml up -d svc-iam-db svc-nocode-core-db
```

### 2. Démarrer les Microservices Backend
Ouvrir des terminaux distincts (ou exécuter en tâche de fond) :

```bash
# Service IAM (Authentification & Sessions) — Port 8001
cd backend/svc-iam
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001

# Service NoCode Core (Moteur Builder, IA EnoC, Projets) — Port 8002
cd backend/svc-nocode-core
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8002

# Service API Gateway (Point d'Entrée Unique & Reverse Proxy) — Port 8000
cd backend/svc-api-gateway
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 3. Démarrer le Frontend (Portal User)
```bash
cd frontend/portal-user
npm start
# L'application s'ouvre sur http://localhost:3000
```

### 4. Compte de Test & Authentification
- **URL de connexion** : [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
- **Email** : `test@enoc.com`
- **Mot de passe** : `Password123!`

---

## 📋 Statuts des Projets : Public vs Privé

Dans l'application, chaque projet possède un statut et un indicateur de visibilité `is_public` :

| Propriété | Projet Privé (`is_public = false`) | Projet Public (`is_public = true`) |
| :--- | :--- | :--- |
| **Accès & Droits** | Strictement réservé à son créateur (`owner_id`). Toute requête non authentifiée est rejetée (HTTP 401/403). | Consultable et prévisualisable sans compte par n'importe quel visiteur disposant du lien. |
| **Génération & Code** | Le moteur de génération FastAPI + React fonctionne **exactement de la même façon**. | Même moteur d'export et de compilation. |
| **Cas d'usage** | Conception confidentielle, travail en cours, applications internes d'entreprise. | Modèles partagés, vitrines publiques, démonstrations clients, landing pages en ligne. |

---

## What's included

### `backend/svc-iam`
FastAPI identity service, evolved from the original `nocode-builder`
monolith's `auth` module:
- Roles for every portal in the blueprint (`super_admin`, `admin`, `user`,
  `customer_service`, `service_desk_l1/l2/l3`), plus `tenant_id` and
  `preferred_locale` (en/fr/es/pt/ar/de) on every user.
- **MFA (TOTP)**: enroll → QR code → confirm → MFA-gated login → step-up
  verify. Tested live with a real generated TOTP code.
- **Refresh token rotation + reuse detection**: every refresh revokes the
  old token and issues a new one; replaying an already-used refresh token
  revokes *every* session for that user. Tested live.

### `backend/svc-api-gateway`
Thin reverse proxy: verifies bearer tokens (signature/expiry/type) before
forwarding, rate-limits per IP, routes by path prefix, stamps
`x-request-id`/`x-upstream-latency-ms`. Tested live end-to-end through
svc-iam (register → 401-without-token → login → authenticated `/me`).

### `backend/svc-nocode-core`
Your existing monolith, containerized into the platform and **identity-
bridged to svc-iam**: it no longer authenticates users itself. What changed:

- **New `app/core/identity.py`**: validates access tokens svc-iam already
  issued (same signing secret — via Vault in real envs) and exposes the
  claims as an `Identity(tracking_id, role, tenant_id)`. Tested live: a
  token minted the way svc-iam mints it decodes here with the `tracking_id`
  matching exactly.
- **9 duplicated `get_current_user` dependencies removed** — one per module
  (auth, projects, schema, data_engine, interface_builder, generator,
  workflow_engine, ai), each previously querying a local `users` table that
  no longer holds real data now that svc-iam owns identity — replaced with
  one shared import. Caught and fixed a self-introduced bug along the way:
  the first patch pass also stripped `from uuid import UUID` from 7 files
  that still use `UUID` as a bare type hint; restored it and re-verified
  every file both compiles *and* imports (FastAPI's router loader logged a
  success line for all 8 modules with zero warnings).
- **`app/modules/auth/router.py` replaced with a deprecation stub** (zero
  routes) — it used to own register/login/refresh/deactivate, which are
  svc-iam's job now. Left as a documented stub rather than deleted so the
  still-referenced `models`/`repository`/`service` files in that module stay
  legible as history.
- Still open: `svc-nocode-core` hasn't been run against a real Postgres
  instance in this session (no Postgres available in the sandbox) — the
  identity bridge and all 8 patched routers were verified via direct
  function calls and full app reload/import, not a live HTTP round-trip
  against a database. Worth an integration-test pass before this goes
  further than local dev.

### `frontend/host-shell`
Vite/React shell: MFA-aware login, silent-refresh-on-401, role-based
routing. Reverse-proxies to `portal-user` at `/portal-user/` — real module
federation is a later step, not yet done.

### `frontend/portal-user`
Your existing frontend, now wired for SSO with host-shell:
- Token storage keys aligned with host-shell (`platform.access_token` /
  `platform.refresh_token`) so a login done once in host-shell is picked up
  here automatically (same-origin `localStorage`) — no second login.
- Token refresh redirected from nocode-core's now-empty auth router to
  svc-iam's `/auth/refresh`.
- **Fixed a live security gap found during this work**: `PrivateRoute.jsx`
  was hardcoded to `return children` unconditionally, with a comment noting
  it had been bypassed for a prior testing sprint — every "protected" route
  was reachable with no authentication at all. The real check (redirect to
  `/auth/login` when not authenticated) is restored.
- Verified: all edited files parse and transpile cleanly (checked with
  esbuild — no Node toolchain/`npm install` was run in this sandbox, so this
  confirms syntax correctness, not a full app build/runtime test).

### `infra/docker-compose.yml`
Local dev only. `svc-iam`, `svc-nocode-core`, and `svc-api-gateway` share one
signing secret via `PLATFORM_SHARED_SECRET` (defaults to a dev-only value —
override it, and in real environments source it from Vault, not compose).

## Run it locally

```bash
cd infra
docker compose up --build
```
Open `http://localhost:5173`. Register via
`POST http://localhost:8000/api/iam/auth/register` (no registration UI yet —
next Phase 1 item), then log in through the host-shell UI; `portal-user`
loads already authenticated.

## What's deliberately NOT here yet

`svc-tenant`, `svc-billing`, `svc-payment-gateway`, admin/super-admin
portals, customer service / service desk, RGPD site, i18n rollout, and
everything in infra/security/tests beyond this slice — see the phased plan
in the blueprint.

## Suggested next steps

1. Stand up Postgres in a real environment and run `svc-nocode-core` through
   an actual HTTP round-trip (create a project, fetch it) using a token
   minted by svc-iam, to close the one verification gap noted above.
2. Rotate the AI provider API key hardcoded as a default in
   `svc-nocode-core/app/core/config.py` — it should never have been a
   committed default and belongs in Vault along with everything else in
   `SECRET_KEY`.
3. Start pulling `portal-user` out of an iframe into a real module-federated
   remote so it shares `pkg-design-system` instead of being visually
   separate from host-shell.

---

## Phase 2 & 3 — Billing/Admin and Support/RGPD

### Verification gap closed
`svc-nocode-core` was run against **real PostgreSQL** (installed in this
session, not SQLite): registered a user through svc-iam, inserted the
matching row nocode-core's schema still requires (see "known limitation"
below), created a project through the full chain
**host → gateway → identity bridge → real Postgres write**, listed it back,
and — the actual proof — queried the row directly with `psql`, outside the
app entirely, confirming it's really there with the correct `owner_id`.

### New services (all tested live — register/login/create/list/escalate
### flows run against real running instances with curl, not just imported)

- **`svc-tenant`** — tenant CRUD, plan assignment. `super_admin`-only for
  create/list/update; a tenant's own admin can read their own tenant.
- **`svc-billing`** — subscriptions and invoices. Tested: create subscription
  → issue invoice → mark paid.
- **`svc-payment-gateway`** — checkout session + webhook handling, HMAC
  signature verification. Ships with `MockProvider` (see
  `app/modules/payments/provider.py`) — **no real PSP integration**, by
  necessity (no network route to Stripe/Adyen from this sandbox, and no real
  merchant credentials to hold). Tested the full loop: create checkout →
  sign a webhook payload → POST it → confirm the invoice actually flips to
  `paid` in svc-billing → confirm a **wrong** signature is rejected with 401.
- **`svc-customer-service`** — ticket CRUD, any authenticated user can open
  a ticket, `customer_service`/`admin`/`super_admin` see the full queue.
- **`svc-service-desk`** — L1/L2/L3 ticket queues. Tested: an L1 agent can
  see the L1 queue but gets 403 on the L3 queue; escalating a ticket
  correctly moves it out of the L1 queue and into L2's.
- **`svc-consent-dsar`** — cookie/consent records (works **without** login,
  via a `session_id`, for pre-login cookie banners) and GDPR DSAR requests
  (access/erasure/portability — requires login). Tested: anonymous consent
  accepted, anonymous consent *without* a session id correctly rejected
  (400), a non-admin correctly blocked (403) from the DSAR queue, an admin
  resolving a request.

### A real bug found and fixed during this build
Four of the new services (`svc-tenant`, `svc-billing`,
`svc-payment-gateway`, `svc-service-desk`) each mounted their router with a
prefix repeating their own service name (e.g. `svc-billing`'s router at
`/billing`). That's invisible when you test a service directly on its own
port — which is what the first pass of testing did — but breaks the moment
it's called *through the gateway*, because the gateway already strips
`/api/billing` and forwards the remainder, which then doesn't match a
router still expecting `/billing/...`. Caught by explicitly re-testing
through the gateway (not just directly), fixed by dropping the redundant
router prefix in all four, and re-verified: all four routes that previously
would have 404'd now return the correct status through the full
gateway path.

### New frontends
- **`portal-admin`** — tenant-scoped dashboard: subscription status,
  invoices, support tickets for the signed-in admin's org.
- **`portal-super-admin`** — platform-wide tenant list, `super_admin`-only.
- **`site-legal-rgpd`** — privacy/cookie policy pages (placeholder legal
  text — needs real legal review before production), a cookie consent
  banner wired to `svc-consent-dsar` (works pre-login), and a DSAR
  submission form (requires login).

Both admin portals are now wired into `host-shell`'s role-based routing
(previously `url: null` placeholders). `svc-customer-service`/
`svc-service-desk` don't have dedicated agent-facing portals yet — Phase 3
follow-up; the APIs are live and tested, the UI isn't built.

### Known limitations, stated plainly
- **New frontends were syntax-checked (esbuild), not runtime-built** — same
  caveat as Phase 1's frontend work: no `npm install`/`npm run build` was
  run in this sandbox.
- **`svc-nocode-core`'s user table is a real cross-service data-modeling
  gap**, not just a Phase-1 leftover: it still has a local `users` table
  with a real foreign key (`nocode_projects.owner_id → users.tracking_id`),
  so creating a project requires a matching row to exist there even though
  svc-iam is the actual identity owner. This session's test bridges that by
  inserting a matching row manually — that's a workaround, not a fix. The
  real fix is dropping the FK constraint (nocode-core doesn't need to know
  anything about a user beyond their id) or introducing a lightweight
  denormalized user reference synced via a Kafka event
  (`iam.user.created.v1`, per the blueprint's topic scheme) — not done here.
- **`svc-payment-gateway`'s mock-to-billing call and `svc-billing`'s
  `mark-paid` endpoint have no service-to-service auth** — anyone who can
  reach `svc-billing` directly (bypassing the gateway) can call
  `/billing/invoices/{id}/mark-paid` with no credential at all. Flagged in
  the code comment; real fix is mTLS or a service credential, which belongs
  in the security-layer phase, not silently deferred without a paper trail.
- Cross-service DSAR erasure (actually deleting a user's data across every
  `svc-*` database when a DSAR erasure request is approved) is **not
  implemented** — `svc-consent-dsar` only tracks the request and lets an
  admin mark it resolved. Real fulfillment needs `svc-audit-log` and a
  defined per-service erasure contract, which is Phase 4 territory per the
  blueprint.

---

## Round 3 — Service-to-service auth + real DSAR erasure + agent portals

### Service-to-service auth (the previously-flagged open endpoint)
Added `app/core/service_auth.py` (deployed to all 7 relevant services): a
short-lived (60s) JWT with `type: "service"`, minted right before a call and
carried in a dedicated `X-Service-Auth` header — kept separate from the
user-facing `Authorization` header so a service token and a user token can
never be substituted for each other. `svc-billing`'s `mark-paid` endpoint
now requires a valid token naming `svc-payment-gateway` as caller;
`svc-payment-gateway`'s webhook handler mints and sends one. Verified live,
including two negative tests: the call is rejected with no token, and
rejected again when a real *user* access token is sent instead of a service
token (wrong token type).

### Real cross-service DSAR erasure
`svc-iam`, `svc-nocode-core`, `svc-customer-service`, and `svc-service-desk`
each got an `/internal/erase-user/{user_id}` endpoint, gated by the same
service-token mechanism (only `svc-consent-dsar` is an authorized caller).
`svc-consent-dsar` got a new `erasure.py` module that fans out to all four
when an admin marks an **erasure** DSAR **completed** — if any target
fails, the request is left `in_progress` with per-service results recorded
in `notes` instead of silently reporting success. `svc-billing` is
deliberately excluded (see the code comment: invoices are tenant-scoped,
not user-scoped, and generally must be retained for tax/legal reasons —
a real legal question, not something to silently automate away).

Erasure strategy differs by service and is documented inline:
`svc-iam` anonymizes in place (email/name become placeholders, account
deactivated, all sessions revoked) rather than hard-deleting, since other
services may still reference the user id; `svc-nocode-core` hard-deletes
owned projects, since nothing else references a project's own primary key;
`svc-customer-service`/`svc-service-desk` redact ticket subject/description
but keep the ticket shell, so support-team metrics survive even after the
requester's content doesn't.

**Verified live, end to end, twice** (the first run surfaced two real bugs,
both fixed and then reconfirmed with a clean pass):
1. A user registers, creates a project, opens a customer-service ticket,
   opens a service-desk ticket.
2. They submit an erasure DSAR.
3. An admin resolves it — this triggers real calls to all four services.
4. Confirmed after: nocode-core shows zero projects, both ticket services
   show `[redacted]` content, and `/auth/me` with the user's *original*
   token returns the anonymized identity with `is_active: false`.

**Two real bugs found by actually running this, not by inspection:**
- `erasure.py`'s target path for `svc-service-desk` repeated the exact same
  mistake as the earlier gateway-routing bug (a stripped router prefix,
  reintroduced in a different file) — a 404 on first run, fixed and
  reverified.
- The anonymization placeholder email used `@deleted.local` — `.local` is
  an RFC 6762 reserved TLD that pydantic's `EmailStr` validator rejects,
  which meant *any* endpoint serializing an erased user's profile (like
  `/auth/me`) 500'd after erasure. Caught by testing that exact call, not
  by reading the code. Fixed to a non-reserved placeholder domain, verified
  the fix against `EmailStr` directly before retesting the full flow.

### New: customer-service and service-desk agent portals
`portal-customer-service` (ticket queue, status updates, one-click escalate)
and `portal-service-desk` (L1/L2/L3 queue scoped to the logged-in agent's
own level, with escalate-to-next-level) — the two roles that previously had
a working API but no UI. Wired into `host-shell`'s role routing, same
SSO pattern as the other portals. Syntax-checked (esbuild), not
runtime-built, same caveat as every other frontend in this project.

### Still open
- Same frontend-build caveat as before: no `npm install`/`npm run build`
  was run for any portal in this sandbox.
- Erasure orchestration is synchronous request/response, not durable
  (no retry queue) — noted in `erasure.py` itself as the natural next step
  once Kafka is in place.
- `svc-nocode-core`'s cross-service user-row bridge (see the earlier "known
  limitation" above) is unchanged — still a manual workaround in testing,
  not a real fix.
