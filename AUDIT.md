# Veydria pre-launch audit

Date: 2026-07-22. Scope: the whole repository at HEAD `bb6ae2e` on branch `main`. Method: static reading of the code, real command output (type check, lint, unit tests, Playwright, production build, `pnpm db:verify`, `pnpm audit`, `pnpm licenses list`, git history search), and cross checks against the environment templates. This pass is investigation only. Nothing was changed except adding this file.

## Executive summary

Veydria is close to launch ready. The core is well built. Multi tenant isolation is enforced on every query I read, authentication and authorization are in place on every route, the tamper evident audit log holds up, and all six quality gates pass. I found no critical defects and no data isolation gap.

What holds it back from a clean go live is a short list of hardening and finish work: the audit log secret can silently fall back to a public default, the billing page can error and the billing flow is not wired end to end, three dependency advisories are rated high, and a local development database password sits in the pushed git history. None of these are deep architectural problems.

Findings by severity:

- CRITICAL: 0
- HIGH: 3
- MEDIUM: 10
- LOW: 6

Verdict: not launch ready today, but close. Clear the seven must fix items below and it is ready for a controlled launch. Most of the must fix work is configuration and finish work, not redesign.

### Must fix before launch

1. Guard `AUDIT_LOG_SECRET` in production. Today it falls back to the public string `dev-audit-secret-change-me`. For a product whose selling point is a tamper evident audit log, throw on boot when the secret is unset or equal to the default in production. (H1)
2. Fix or hide billing. The dashboard billing page renders Clerk `PricingTable` unconditionally, which errors when Clerk Billing is not enabled, and the custom Stripe backend is never called from the UI. Pick one billing path, wire it end to end, or hide billing so no page can error. (H2)
3. Patch the high severity dependencies. Upgrade `sharp` to 0.35.0 or newer and resolve `object-path`, then re-run `pnpm audit`. (H3)
4. Purge the local database password from git history and rotate it, and confirm no production secret can ever reach a tracked file. (M6)
5. Rate limit the evaluation trigger and the other authenticated expensive endpoints, not just ingest. (M1)
6. Decide on PostHog, Resend, and Langfuse. Either wire them or remove the dependencies, then correct the subprocessor and cookie copy so it matches reality. (M5, L1)
7. Guard `request.json()` so an empty body returns a clean 400, not a 500. (M2)

### Can wait

- Add AI system edit and delete UI (the service and API already exist, agents already have the pattern). (M3)
- Replace or remove the Notifications starter stub with its dead links. (M4)
- Add a Content Security Policy header. (M7)
- Build the AWS EC2 and Caddy production deployment if that is the launch target. (M8)
- Add self serve GDPR data export and deletion, or document the manual SLA. (M9)
- Tune Sentry PII capture and trace sampling for production. (M10)
- Housekeeping: docker compose Postgres version and secret default, pin Python deps and add pip-audit to CI, run a formal license review, fix the Notifications page title. (L2, L3, L4, L5, L6)

## Quality gates

All six pass. Run on this machine during the audit.

| Gate | Command | Result |
| ---- | ------- | ------ |
| Type check | `pnpm exec tsc --noEmit` | Pass, 0 errors |
| Lint | `pnpm lint` (oxlint) | Pass, 0 errors, 30 warnings (all no-console in CLI scripts and tests, expected) |
| Unit tests | `pnpm test` (Vitest) | Pass, 19 of 19 |
| End to end | `pnpm test:e2e` (Playwright) | Pass, 5 of 5 |
| Production build | `pnpm build` | Pass, 71 of 71 pages |
| Core loop and audit chain | `pnpm db:verify` | Pass, fresh org classified high with 18 obligations, alert raised, chain verifies across 16 entries |

## What is solid (verified strengths)

- Multi tenant isolation. Every service function takes a `TenantContext` and scopes queries with `eq(table.organizationId, ctx.organizationId)`. I read all 13 service files. List, get, update, and delete for AI systems, agents, evaluations, obligations, documents, alerts, monitoring, and the audit log are all org scoped. Ownership is checked before mutations (`getAiSystem`, `getAgent`, and equivalents run first), and cross org references are blocked (`assertSystemInOrg` in `agents.ts`, and `createEvaluation` verifies the agent belongs to the org). I found no query missing an org filter and no route that trusts a client supplied id without an ownership check.
- Authentication and authorization. `src/proxy.ts` protects `/dashboard(.*)` with Clerk. API routes guard at the handler level: 21 route files call `requireRole`, `requireTenant`, or `resolveApiKey`. The public API (`/api/v1/*`) and `/api/ingest` authenticate with a hashed API key. Both webhooks verify signatures (`verifyWebhook` for Clerk, `constructEvent` for Stripe) and return 503 when their secret is not configured. Mutations require at least the member role, billing requires admin.
- Input validation and injection safety. Every route parses input with a Zod schema. Drizzle builds parameterized queries, and the only raw SQL is static DDL (the cosine function and the audit trigger) plus a `date_trunc` rollup that interpolates a column reference, not user input. No SQL injection surface found. React escapes output, and the three `dangerouslySetInnerHTML` uses (theme script, JSON-LD, chart CSS) all render static data, not user input.
- Tamper evident audit log. `appendAuditLog` serializes rows with a key order stable canonical form, signs them with an HMAC that chains each row to the previous hash, takes a per organization advisory lock so sequence and hash stay consistent, and records the hash formula version per row. A database trigger blocks UPDATE and DELETE on `audit_log`. `verifyAuditChain` recomputes and checks the chain, and `pnpm db:verify` confirms it.
- Legal pages are real. Privacy (GDPR legal bases, data subject rights, CCPA), Terms, Cookies (Do Not Track, no ad cookies), a full Data Processing Addendum (controller and processor roles, Standard Contractual Clauses, breach notification, return and deletion, audits), and a subprocessors page. No placeholder text, no fake company name, no fabricated address. Legal name is simply Veydria.
- Reliability basics. Custom `not-found.tsx`, `global-error.tsx`, a dashboard `loading.tsx`, and an error boundary exist. The evaluation client has a 20 second timeout and records a clear error instead of throwing when the evals service is down.
- SEO. `sitemap.ts`, `robots.ts`, JSON-LD, Open Graph, and per page metadata are all present.
- Repository hygiene. Working tree clean, local `main` equals `origin/main`, the full database layer (schema, both migrations, meta snapshots, seed scripts) is committed, and no data dump is tracked. The current tree contains no secret.

## Findings

### CRITICAL

None found.

### HIGH

#### H1. Audit log secret falls back to a public default with no production guard

- Area: `src/lib/audit-hash.ts` (`getAuditSecret`), also `docker-compose.yml`.
- Issue: `getAuditSecret()` returns `process.env.AUDIT_LOG_SECRET ?? 'dev-audit-secret-change-me'`. Nothing throws if the variable is unset in production. The same insecure default is baked into `docker-compose.yml` as `${AUDIT_LOG_SECRET:-dev-audit-secret-change-me}`. The default string is public in this repository and in `.env.example`.
- Risk: the audit log is the product's core compliance guarantee. If an operator forgets to set `AUDIT_LOG_SECRET` in production, every row is signed with a key that anyone can read from the repo. An insider or an attacker with database write access could forge entries and recompute a valid chain, and `verifyAuditChain` would report the forged chain as intact. The tamper evidence becomes worthless, silently.
- Fix: in production (`NODE_ENV === 'production'`), throw on boot when `AUDIT_LOG_SECRET` is missing or equal to the known default. Do the same in the migrate and verify scripts. Remove the insecure default from `docker-compose.yml` so the stack refuses to start without a real secret.

#### H2. Billing page can error and billing is not wired end to end

- Area: `src/app/dashboard/billing/page.tsx`, `src/server/services/billing.ts`, `src/app/api/billing/route.ts`, `src/app/api/webhooks/stripe/route.ts`.
- Issue: the dashboard billing page imports and renders Clerk `<PricingTable for='organization' />` unconditionally. Clerk's PricingTable requires Clerk Billing to be enabled on the Clerk instance, which needs a paid Clerk plan and a Stripe connection configured in the Clerk dashboard. When Clerk Billing is not enabled the component errors, which is the failure seen before. Separately, the repository also contains a complete custom Stripe layer (`createCheckoutSession`, `createPortalSession`, a signature verified Stripe webhook, and `STRIPE_PRICE_*` env mapping) that no UI ever calls. So there are two billing systems, neither wired end to end, and the one on screen is the crash prone one.
- Risk: `/dashboard/billing` can throw for any customer whose Clerk instance does not have Billing enabled, and there is no working path to actually subscribe or manage a plan. Revenue collection does not function as shipped.
- Fix: choose one path. Either enable Clerk Billing properly and gate the PricingTable so it only renders when Billing is confirmed enabled (otherwise show a friendly message), or drop Clerk Billing and wire the existing custom Stripe checkout and portal into the billing page. Until then, hide the billing page so it cannot error. The marketing `/pricing` page is safe: it renders the static `PLANS` config, not the Clerk component.

#### H3. Dependency advisories rated high

- Area: node dependencies, from `pnpm audit` (exit code 1, 7 vulnerabilities: 3 high, 4 moderate).
- Issue and risk, high severity:
  - `sharp` less than 0.35.0 inherits libvips CVEs (CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591). `sharp` is a direct dependency (`^0.33.5`) used for image processing. Risk depends on whether untrusted images are processed at runtime.
  - `object-path` prototype pollution (two advisories, fixed in 0.11.5 and 0.11.8). Transitive. Prototype pollution can lead to logic tampering depending on reachability.
- Moderate, for completeness:
  - `esbuild` less than or equal to 0.24.2, dev server request exposure. Development only, not a production risk.
  - `postcss` less than 8.5.10, XSS in CSS stringify output. Build time.
  - `@hono/node-server` less than 2.0.5, path traversal on Windows, reached only through `@modelcontextprotocol/sdk` (the MCP server), and Windows only.
- Fix: run `pnpm update sharp` to 0.35.0 or newer, resolve `object-path` with `pnpm audit --fix` or by updating the parent that pulls it, bump `postcss` and `esbuild` through Next where possible, and re-run `pnpm audit`. Add `pnpm audit` to CI as a non blocking report first, then a gate once clean.

### MEDIUM

#### M1. Rate limiting covers only the ingest endpoint

- Area: `src/lib/api/rate-limit.ts`, applied only in `src/app/api/ingest/route.ts` (600 per 60 seconds per API key).
- Issue: the evaluation trigger (`/api/evaluations` and `/api/evaluations/[id]/run`), document generation (`/api/documents`), and reclassify (`/api/ai-systems/[id]/classify`) have no rate limit. These are the expensive endpoints: the evaluation trigger makes an outbound call to the evals service, and document generation and classification are heavier than a read. The limiter is also in memory and per process, so it does not hold across more than one instance.
- Risk: an authenticated member can hammer the evaluation or document endpoints and run up cost or degrade the service. In a multi instance deployment the limiter does not coordinate, so the effective limit is multiplied by the instance count.
- Fix: apply `rateLimit` to the evaluation trigger, document generation, and classify, keyed by organization or user. For more than one instance, back the limiter with Redis behind the same interface.

#### M2. Empty request body returns 500 instead of 400

- Area: 12 API routes that call `SCHEMA.parse(await request.json())` directly, including `agents`, `ai-systems`, `alerts/[id]`, `api-keys`, `billing`, `documents`, `evaluations`, `obligations/[id]`, and `ingest`. Handler in `src/lib/api/handler.ts`.
- Issue: `request.json()` on an empty or non JSON body throws a `SyntaxError`. `handleRoute` only maps `ApiError` and `ZodError`, so a `SyntaxError` falls through to the generic 500 branch and logs "Unhandled route error". This is the "Unexpected end of JSON input" seen in the dev logs, and it affects all 12 routes, not just one.
- Risk: clients that send an empty body get a 500 and a noisy server log rather than a clean 400 with a validation message. It is caught and does not crash the process, but it is the wrong status and it hides real 500s in the logs.
- Fix: add a small helper that reads the body defensively (returns an empty object when there is no content) or catch the parse error and throw `badRequest`. Apply it in the shared handler so every route benefits.

#### M3. AI systems have no edit or delete UI

- Area: `src/app/dashboard/systems/` has `page.tsx`, `new/page.tsx`, and `[id]/page.tsx` only. Compare `src/app/dashboard/agents/` which also has `[id]/edit/page.tsx`.
- Issue: `updateAiSystem` and `deleteAiSystem` exist in the service, and `PATCH` and `DELETE` exist on `/api/ai-systems/[id]`, but the system detail page offers only Reclassify and document generation. There is no button to edit a system's metadata or to delete a system.
- Risk: users can create and view AI systems but cannot correct a name, owner, or lifecycle, and cannot remove a system, except through the API. For a portfolio product this is a visible gap, and it is inconsistent with agents, which have full CRUD in the UI.
- Fix: add an edit page and a delete action for systems, mirroring the agents pattern that already exists.

#### M4. Notifications page is a starter stub with dead links

- Area: `src/app/dashboard/notifications/page.tsx` and `src/features/notifications/components/notifications-page.tsx`.
- Issue: the page renders from a client side `useNotificationStore` (a Zustand mock store from the starter), not from real data. Its action routes point at `/dashboard/product`, `/dashboard/kanban`, and `/dashboard/chat`, which do not exist in Veydria. The page title is also the starter format "Dashboard: Notifications".
- Risk: a signed in user visiting Notifications sees mock content and can click actions that lead to routes that do not exist. It reads as unfinished, and the real notification worthy data (alerts) lives on a different page.
- Fix: either wire the Notifications page to real alerts and audit activity, or remove the page and its nav entry.

#### M5. PostHog, Resend, and Langfuse are advertised and configured but not wired

- Area: `package.json` (`posthog-js`, `posthog-node`, `resend`, `@react-email/components`, `langfuse`), `.env.example`, `.env.production.example`, and marketing copy.
- Issue: a repository wide search finds no code that initializes PostHog, sends a Resend email, or sends a Langfuse trace. The env cross check confirms the code never reads `NEXT_PUBLIC_POSTHOG_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, or the Langfuse variables. Yet the integrations, cookies, and subprocessors pages present all three as active, and the dependencies and env templates carry them.
- Risk: unused production dependencies increase the attack surface and the audit burden. Transactional email is not implemented, so any product flow that assumes an email is sent does not send one. The legal and marketing copy describes analytics and email processing that are not actually happening.
- Fix: decide per integration. If they are launch scope, wire them (a PostHog provider gated on consent, a Resend sender for the flows that need it, Langfuse in the LLM gateway). If not, remove the dependencies and env entries and correct the copy. See also L1.

#### M6. Local database password is in the pushed git history

- Area: `HANDOFF.md` history. Added in commit `114eeb3`, removed in `bb6ae2e`.
- Issue: earlier versions of `HANDOFF.md` contained `password REDACTED` and `postgresql://postgres:REDACTED@localhost:5432/agentproof`. The current tree is clean (`git grep REDACTED` returns nothing), but the string lives in every commit between `114eeb3` and `bb6ae2e`, and that history was pushed to the private remote. The `.env` file itself was never tracked.
- Risk: this is a local development database password for `localhost`, so real world exploitability is low. It is not a production credential and is not reachable from the network. The concern is hygiene and process: a secret reached a tracked file and was pushed, and the same path could leak a production secret next time. Anyone with read access to the repo can recover it.
- Fix: rotate the local password, purge the string from history (git filter-repo or BFG, then a force update of the remote after coordinating), and add a pre commit secret scan so the next secret is caught before it is committed.

#### M7. No Content Security Policy

- Area: `next.config.ts` headers.
- Issue: the app sets X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, and HSTS, but no Content Security Policy. The config comment says CSP was deferred because Clerk and an inline theme script would need per request nonces.
- Risk: without a CSP, an injected script has fewer barriers. For a security and compliance product this is a visible omission that enterprise reviewers will ask about.
- Fix: add a CSP with a per request nonce for the inline theme script, allow the Clerk and Sentry origins, and start in report only mode to catch violations before enforcing.

#### M8. Production deployment is not built

- Area: `docker-compose.yml` (local only), `DEPLOY.md` (Vercel oriented), no Caddy config, no production compose.
- Issue: the deployment story today is a local full stack compose plus a Vercel and container guide in `DEPLOY.md`. The AWS EC2 host with Caddy and a production compose described as the next phase in `HANDOFF.md` does not exist yet. The local compose uses `pgvector/pgvector:pg16` while the app targets Postgres 18.
- Risk: if the launch target is the planned EC2 and Caddy setup, the artifacts and runbook are not there. If the target is Vercel, this is fine and `DEPLOY.md` covers it.
- Fix: confirm the launch target. If EC2, write the production compose (web, Postgres with pgvector, evals, Caddy), the Caddy config, and the EC2 runbook, and align the Postgres image version.

#### M9. GDPR data export and deletion are policy only

- Area: product features versus the Privacy, Terms, and DPA pages.
- Issue: the legal pages describe data subject rights, export, and deletion, and the DPA promises return or deletion on termination. In the product there is no self serve export of a tenant's data and no delete organization or delete account action. Per resource deletes exist (delete a system, delete an agent), but not an org level export or erase.
- Risk: for a product sold to EU and US enterprises, buyers will ask how export and deletion work. A manual process is acceptable at launch, but it must exist and be documented with an SLA.
- Fix: add a self serve export (the audit log and inventory as JSON or CSV) and an organization deletion path, or document the manual process and turnaround in the DPA and a runbook.

#### M10. Sentry sends PII and samples every trace

- Area: `src/instrumentation.ts`.
- Issue: `sendDefaultPii: true` attaches request headers and client IP to Sentry events, and `tracesSampleRate: 1` sends 100 percent of traces. Sentry is not listed on the subprocessors page.
- Risk: sending IP and headers to Sentry is a privacy consideration for a compliance product and means Sentry processes personal data, so it should be a listed subprocessor with a data processing agreement. A 100 percent trace rate is costly at volume.
- Fix: set `sendDefaultPii` to false unless you need it and have covered it, lower the production trace sample rate, and add Sentry to the subprocessors list.

### LOW

#### L1. Subprocessor and cookie copy lists vendors that are not active

- Area: `src/app/(marketing)/subprocessors/page.tsx`, `src/app/(marketing)/cookies/page.tsx`.
- Issue: the subprocessors table lists Resend and PostHog as active processors, and the cookies page says analytics runs through PostHog, but neither is wired (see M5). Langfuse is on the integrations page but not on the subprocessors list.
- Risk: a subprocessor list that names vendors who are not actually processing data is inaccurate, which undercuts trust for the exact buyers who read that page.
- Fix: align the copy with what is actually running once M5 is decided.

#### L2. docker-compose Postgres version and secret default

- Area: `docker-compose.yml`.
- Issue: uses `pgvector/pgvector:pg16` while the app targets Postgres 18, and defaults `AUDIT_LOG_SECRET` to the insecure value (see H1).
- Risk: version drift between local and target, and an easy way to run with an insecure audit secret.
- Fix: match the Postgres major version to the target and remove the insecure default.

#### L3. Python dependencies are unpinned and unscanned

- Area: `services/evals/requirements.txt`.
- Issue: dependencies use open ranges (`fastapi>=0.115`, `uvicorn[standard]>=0.30`, `pydantic>=2.9`, `httpx>=0.27`). `pip-audit` is not installed in the service virtualenv, so I could not run a Python vulnerability scan. Installed versions are recent (fastapi 0.139.2, starlette 1.3.1, uvicorn 0.51.0, pydantic 2.13.4, httpx 0.28.1, h11 0.16.0).
- Risk: open ranges make builds non reproducible and can pull an untested or vulnerable version. No Python vulnerability gate exists.
- Fix: pin the versions (a lock file or exact pins), add `pip-audit` to the service and to CI.

#### L4. License review

- Area: dependency tree, from `pnpm licenses list`.
- Issue: the tree is overwhelmingly permissive (MIT, Apache-2.0, ISC, BSD variants, 0BSD, BlueOak, Unlicense). Weak copyleft appears in dev and build tools (`axe-core` and `@axe-core/playwright` are MPL-2.0, dev only; `lightningcss` is MPL-2.0, build time) and in the `sharp` native binary (`@img/sharp-win32-x64` is Apache-2.0 AND LGPL-3.0-or-later). One package is `FSL-1.1-MIT`, a source available license with a non compete that converts to MIT over time. No GPL, AGPL, or SSPL was found.
- Risk: low for a SaaS that does not distribute these binaries to end users. MPL and LGPL obligations are minimal in that model. The FSL package is worth confirming does not restrict your use.
- Fix: run a formal license check in CI (for example a license allowlist), identify the FSL-1.1-MIT package, and confirm the LGPL binary is used as a dynamic dependency.

#### L5. Notifications page title uses the starter format

- Area: `src/app/dashboard/notifications/page.tsx`.
- Issue: `metadata.title` is "Dashboard: Notifications", unlike the clean titles elsewhere (for example "Alerts", "Audit log").
- Risk: cosmetic inconsistency in the browser tab and search snippets.
- Fix: set the title to "Notifications" (moot if the page is removed per M4).

#### L6. Minor defense in depth and a basic policy check

- Area: `src/server/services/evaluations.ts` (`runEvaluation`), `src/server/services/monitoring.ts` (`screenOutput`).
- Issue: `runEvaluation` loads the agent with `eq(agents.id, evaluation.agentId)` without an org filter. It is safe because the `agentId` comes from an already org scoped evaluation row, so it cannot cross tenants, but adding the org filter would be defense in depth. Separately, the monitoring policy check flags only a single email regular expression as personal data.
- Risk: low. No isolation gap today. The policy check is a thin first version.
- Fix: add the org filter to the agent lookup for consistency, and expand the monitoring policy checks over time.

## Area by area coverage

1. Feature completeness. No TODO, FIXME, HACK, or XXX markers in the code (the only hits are documentation comments). Placeholders found: plan prices (`src/config/plans.ts`) and the LLM gateway fallback (`src/server/llm/gateway.ts`), both intentional and labeled. Gaps: AI system edit and delete UI (M3), Notifications stub (M4), billing not wired (H2), custom Stripe checkout is API only with no UI (H2), and PostHog, Resend, Langfuse not wired (M5). Everything else walks through real data (verified by the passing end to end journey and empty state tests).
2. Billing. Covered in H2. Clerk Billing needs a paid Clerk plan plus a Stripe connection in the Clerk dashboard, which is why the PricingTable path errors when it is not enabled. Options: enable Clerk Billing and gate the component, wire the existing custom Stripe layer into the UI, or hide billing. The marketing pricing page does not crash.
3. Multi tenant isolation. No gap found. Every query is org scoped, ownership is checked before mutations, cross org references are blocked. See the strengths section.
4. Authentication and authorization. Dashboard protected by middleware, API protected at the handler level on all 21 data routes, public API and ingest use hashed API keys, webhooks verify signatures, mutations require member and billing requires admin.
5. Security. Secret scan: current tree clean, no `sk_` keys or tokens in history, but the local DB password is in history (M6). Input validation everywhere, no SQL injection surface, XSS safe. Headers present except CSP (M7). Rate limiting thin (M1). Audit tamper evidence solid except the secret default (H1).
6. Tech stack. Listed in the appendix. `pnpm audit` reports 7 issues (H3). `pip-audit` could not run (L3). Licenses mostly permissive (L4).
7. Legal and compliance. Privacy, Terms, Cookies, and a full DPA are real and specific, no fake identity. GDPR rights are described but export and deletion are not self serve (M9). No cookie consent banner, which is low risk today only because PostHog is not actually running (M5, L1).
8. Correctness and reliability. Graceful error handling through `handleRoute`, evals degrade cleanly when the service is down, empty and loading and 404 and 500 states exist. The empty body 500 is the main gap (M2).
9. Production readiness. `.env.example` and `.env.production.example` cover every variable the code reads (the extra keys are the unwired integrations in M5). Migrations and the regulations seed run idempotently on a fresh database, and the demo seed is separate and documented as not for production. Deploy artifacts are local and Vercel only (M8). Observability: Sentry is wired (M10), PostHog and Langfuse are not (M5). Transactional email is not wired (M5). SEO is complete.
10. GitHub completeness. Working tree clean, local equals origin, the database layer is committed with no data dump, and README, HANDOFF, DEPLOY, CONTRIBUTING, LICENSE, and the CI workflow are present and current. This file will be the only addition.
11. Quality gates. All six pass, numbers in the gates table.

## Appendix: stack and versions

Web app: Next.js 16.2.6 (App Router, Turbopack), React 19.2.4, TypeScript 5.7.2, Tailwind CSS 4.2.2, shadcn/ui on Base UI 1.6.0, Recharts 2.15.4 (local Tremor style components), Zod 4.3.6, TanStack Query 5.95.2, Table 8.21.3, Form 1.28.5, Drizzle ORM 0.45.2 with postgres 3.4.9. Auth and billing: Clerk 7.5.20, Stripe 22.3.2. Observability and mail (declared): Sentry 10.45.0 (wired), posthog-js 1.404.1 and posthog-node 5.45.2 (not wired), resend 6.17.2 and @react-email/components (not wired), langfuse 3.38.20 (not wired). Tooling: oxlint 1.57.0, oxfmt, Vitest 4.1.10, Playwright 1.61.1, @axe-core/playwright 4.12.1. Evals service: FastAPI 0.139.2, uvicorn 0.51.0, pydantic 2.13.4, starlette 1.3.1, httpx 0.28.1 on Python 3.14. MCP: @modelcontextprotocol/sdk 1.29.0. Database: PostgreSQL 18.4 in development with a real array cosine fallback because native pgvector is not installed locally. Runtime: Node 22 pinned in `.nvmrc` (built with 24.18.0), pnpm 11.15.1.

Data source for this appendix: `package.json`, `services/evals/requirements.txt`, `pnpm licenses list`, and `pnpm audit`.
