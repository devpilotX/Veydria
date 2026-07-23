# Veydria: session handoff

Living notes so the next session starts with zero context loss. Product name is Veydria (renamed from the working title AgentProof). It is a B2B SaaS that governs, tests, and documents AI agents against the EU AI Act, NIST AI RMF, and ISO 42001, built on the Kiranism next-shadcn-dashboard-starter.

Hard rules that always apply: never use the em dash character anywhere (code, comments, copy, commit messages). Keep copy human and specific. Keep the starter design language. Do not commit secrets.

## Current state at a glance

- Branch main. The repository is published to the private GitHub remote (origin https://github.com/devpilotX/Veydria.git, default branch main) with full history and all tags.
- Professionalized for publishing: a full README.md, a proprietary LICENSE (with the MIT starter notice retained), CONTRIBUTING.md, CODE_OF_CONDUCT.md, a GitHub Actions CI workflow (tsc, lint, unit tests, production build), pull request and issue templates, and DEPLOYMENT.md renamed to DEPLOY.md. Removed the starter FUNDING.yml and the unused skills-lock.json.
- The product is LIVE in production, deployed on a single AWS EC2 host at https://veydria.devpilotx.com behind Caddy (Docker containers: web, postgres with pgvector, evals, caddy). See the section "Session 2026-07-23: live audit, fixes, and current truth" at the end for the full verified state, the fixes shipped, the deploy and de-drift mechanics, and the honest limitations.
- All green: tsc clean, oxlint 0 errors, unit tests 19 of 19, Playwright e2e 5 of 5, production build compiles, pnpm db:verify passes and now chain checks the audit log. Lighthouse homepage accessibility 100 and SEO 100. axe reports zero serious or critical violations on the homepage, sign in, and the signed in dashboard.

## Environment (Windows, PowerShell shell)

- node 24.18.0 (installed via pnpm runtime, resolves at %LOCALAPPDATA%\pnpm\node.EXE), pnpm 11.15.1, git 2.54.0, python 3.14.6, psql (PostgreSQL) 18.4.
- The shell is PowerShell. Use `;` to chain, not `&&`. `pnpm` is a .ps1 shim. Execution policy is set to RemoteSigned for CurrentUser.
- To launch the Next dev server from the shell, do not Start-Process the pnpm shim. Use: Start-Process node with the full path to node_modules\next\dist\bin\next, args dev -p 3010. Poll the port, then stop node processes when done.
- tsx and drizzle-kit run via `pnpm exec`. The pnpm.ps1 line printed to stderr is not an error.
- pnpm gate: pnpm-workspace.yaml has onlyBuiltDependencies (sharp, esbuild, @sentry/cli, core-js) and verifyDepsBeforeRun: false. .npmrc has legacy-peer-deps, shamefully-hoist, verify-deps-before-run=false.
- STALE CACHE GOTCHA: killing the dev server can leave a corrupted .next/dev/types, which makes `next build` fail its type check or `tsc` report errors in .next/dev/types. Fix: run `Remove-Item -Recurse -Force .next` before a build or full typecheck.
- Playwright: the Chromium download lives at %LOCALAPPDATA%\ms-playwright (chromium-1228 full, plus chromium-headless-shell). Reinstall with `pnpm exec playwright install chromium` if missing.

## Database

- PostgreSQL 18.4 at localhost:5432, user postgres. The local password is stored only in .env (gitignored) and is deliberately not written in this file. Database name is `agentproof` (kept as an internal name, not user facing, not renamed to veydria to avoid recreating the DB).
- .env DATABASE_URL has the shape postgresql://postgres:YOUR_LOCAL_PASSWORD@localhost:5432/agentproof. The password lives only in .env, which is gitignored and never committed.
- pgvector is NOT installed locally (Windows admin UAC was declined). Vectors are stored as real[] columns and similarity uses a SQL function `agentproof_cosine_similarity`. The vector helper is isolated in src/db/vector.ts, so switching to native pgvector later is a small change. The deployment phase uses a pgvector enabled Postgres image, but the app still uses the real[] fallback until the embedding columns are migrated to the vector type.
- SQL helper names stay as `agentproof_cosine_similarity` and `agentproof_block_audit_mutation` (internal, not user facing). audit_log has an append only trigger that blocks UPDATE and DELETE per row; TRUNCATE is allowed so the seed can reset.
- Commands: `pnpm db:migrate` (apply migrations, install cosine fn + audit trigger, idempotently seed the regulations KB), `pnpm db:seed` (full reset + demo tenant data), `pnpm db:seed:regulations` (KB only, idempotent), `pnpm db:verify` (fresh org core loop check, now also raises an alert and chain checks the audit log, fails if the chain is broken), `pnpm db:resign` (one time maintenance: re-signs each org's audit chain in place with the current hash formula and removes leftover org_e2e_ test orgs), `pnpm db:generate`, `pnpm db:studio`, `pnpm db:push`.

## Auth (Clerk, linked)

- Real Clerk app linked via the Clerk CLI (v2.2.0, installed globally). App: Veydria, id app_3Go7x2vXw5EXmRXAQPPcloAAE3K, development instance ins_3Go7x4JhiHjGBc5axdbiFthWdPk. Logged in as dipanshukumar117@gmail.com. Frontend API domain for the dev instance is special-bass-35.clerk.accounts.dev.
- Development keys pk_test_ and sk_test_ are in the gitignored .env. Production instance is NOT configured yet; for deploy create a production instance and set pk_live_ and sk_live_ in the host env (see NEXT PHASE), never in the repo.
- src/proxy.ts: demoModeOpen = NODE_ENV !== 'production' && !hasClerkKeys. Keys are present, so the dashboard requires a real sign in. The matcher includes /__clerk/:path* exactly once after /(api|trpc)(.*).
- Sign in and sign up routes are /auth/sign-in and /auth/sign-up. In development, signed in with no organization falls back to the demo org (clerkOrgId org_demo_northwind) which has the seeded data. A real Clerk org starts empty; classification still works because the regulation knowledge base is global.
- getTenantContext in src/lib/auth/tenant.ts maps a Clerk org to a DB org via getOrCreateOrganization. Roles: owner, admin, member, viewer.
- e2e sign in: testing tokens did not clear Clerk's client trust gate with clerk-js v6, so the tests mint a server sign in token (POST api.clerk.com/v1/sign_in_tokens) and sign in with the ticket strategy, then set the fresh org active. See the Testing section.

## Brand (Veydria)

- Single source of truth: src/config/brand.ts. name Veydria, tagline "Proof for every AI decision", url https://veydria.com, emails @veydria.com, twitter @veydria, legalName "Veydria" (no Inc., no fabricated address).
- Palette: Control Blue #2457E6 (primary), Trust Navy #111C4E (text and dark surfaces), Evidence Amber #F4A62A (accent), Soft Background #F7F9FF. Tokens in src/styles/theme.css (:root light, .dark dark). One theme, light and dark toggle only.
- Contrast tuning from the accessibility pass: light --primary is oklch(0.48 0.22 264), the documented Control Blue, so white text on primary buttons meets AA (it was 0.53 and failed). In dark mode --primary stays the lighter oklch(0.62 0.2 264) for legible primary text, and --primary-foreground is a dark navy so filled buttons still pass. Light --muted-foreground was darkened to oklch(0.46 0.04 266), and the risk and severity badge text moved from the 600 to the 700 shade. These are token adjustments only, same brand hues and layout.
- Logo: src/components/brand/logo.tsx. LogoMark is the split V (left stroke currentColor, right stroke var(--primary), amber node #F4A62A). Favicon is src/app/icon.svg plus src/app/favicon.ico and src/app/apple-icon.png from the veydria-brand kit folder. OG card at src/app/api/og/route.tsx uses navy background and the split V.
- No em dashes anywhere in the repo (verified). No "AgentProof" in the UI. Lowercase "agentproof" remains only in the DB name, the two SQL function names, and git history.

## Architecture map

- Schema: src/db/schema/*.ts (enums, identity = organizations/users/memberships/apiKeys, billing = subscriptions, systems = aiSystems/agents, regulations = regulations/regulationClauses/obligations, evaluations = evaluations/evaluationCases, monitoring = monitoringEvents/alerts, audit = auditLog with a hash_version column, documents). Client src/db/index.ts (exports db, client, schema). Migrations in drizzle/ (0000 base, 0001 adds audit_log.hash_version).
- Seed and tools: src/db/seed.ts, src/db/seed-regulations.ts (shared idempotent KB seeder + catalog), src/db/migrate.ts, src/db/verify-core-loop.ts, src/db/resign-audit.ts, src/db/vector.ts, src/lib/audit-hash.ts (canonical stableStringify hash, CURRENT_HASH_VERSION = 2, version aware), src/lib/embedding-fallback.ts.
- Auth libs: src/lib/auth/{roles,tenant,require,api-key,page}.ts. API infra: src/lib/api/{errors,handler,rate-limit}.ts.
- Services: src/server/services/{audit,ai-systems,agents,obligations,evaluations,alerts,documents,monitoring,api-keys,billing,classification,regulations,overview,shared,evals-client,document-generator}.ts. alerts.ts exports raiseAlert (inserts an alert plus its alert.raised audit entry in one transaction). Engines: src/server/engine/{rules,documents}.ts. LLM gateway: src/server/llm/gateway.ts.
- API routes: src/app/api/{ai-systems (+/[id], /[id]/classify), agents (+/[id]), obligations, evaluations (+/[id], /[id]/run), alerts (+/[id]), documents, monitoring/events, ingest (api key auth), audit (+/verify), api-keys, billing, regulations, og, webhooks/clerk, webhooks/stripe, v1/{systems,obligations,audit/verify}}.
- Dashboard pages: src/app/dashboard/{overview, systems (+/[id], /new), agents (+/[id], /[id]/edit, /new), obligations, evaluations (+/[id], /new), monitoring, alerts, documents (+/[id]), audit, regulations, team, settings, billing, notifications, profile, workspaces}. Shared UI: src/components/dashboard/{stat-card,badges,empty-state}.tsx, src/features/dashboard/components/{activity-chart,action-button,new-system-form,agent-form,delete-agent-button,run-evaluation-form,api-keys-manager}.tsx.
- Marketing: src/app/(marketing)/{layout, page, features (+/[slug]), pricing, about, customers, integrations, docs, changelog, security, contact, careers, blog (+/[slug]), privacy, terms, dpa, cookies, acceptable-use, subprocessors, responsible-ai}. Components: src/components/marketing/{header,footer,json-ld,reveal,product-visual}.tsx.
- SEO: src/lib/seo.ts (buildMetadata), src/app/sitemap.ts, src/app/robots.ts. Config: src/config/{brand,plans,marketing}.ts, src/content/blog.ts.
- SDK: sdk/ (package @veydria/sdk, class Veydria, posts to /api/ingest). MCP: mcp/ (package @veydria/mcp, server name veydria, env VEYDRIA_API_KEY and VEYDRIA_BASE_URL). Evals service: services/evals/ (FastAPI, offline heuristic scorer, header X-API-Key = EVALS_SERVICE_API_KEY, a .venv is present, verified on py3.14).
- End to end tests: playwright.config.ts and e2e/ (support/{clerk,db-cleanup,global-setup,session}.ts and {journey,empty-states,a11y}.spec.ts).

## The core loop (works today)

Add a system, classify it, generate obligations, record in the tamper evident audit log. The New system form posts to /api/ai-systems, which calls createAndClassifyAiSystem in src/server/services/classification.ts. That one transaction inserts the system, classifies it with src/server/engine/rules.ts, builds obligations from the global regulation clauses, and appends three audit entries (ai_system.created, ai_system.classified, obligations.generated) in the same transaction. If it fails, nothing is written and the error surfaces.

## What is done

- Phases 0 through 8: setup and branding, database, auth and RBAC and billing scaffolding, domain engines (rules, LLM gateway, vector search, document generator, SDK, MCP, FastAPI evals), dashboard pages, marketing site with full SEO, legal pages, hardening, and initial deploy config. The homepage was rebuilt into a polished landing page with cited regulatory facts, the product was rebranded to Veydria, and the Clerk app was linked.
- Step 1, core loop hardening: creating and classifying a system is one atomic transaction that also generates obligations and records ai_system.created, ai_system.classified, and obligations.generated (with a per framework breakdown). Verified in a fresh org by pnpm db:verify.
- Step 2, product gaps closed:
  - Agents: New agent form and route, agent detail page, and edit page, all wired to the agents API. Create, update, and delete record agent.created, agent.updated, agent.deleted. The create form can set the initial status.
  - Evaluations: Run evaluation button on the evaluations screen and on each agent, an evaluation detail page (status, score against threshold, per case results, any dimension breakdown), and a re-run route. runEvaluation records evaluation.started then evaluation.completed, and when the evals service is unreachable it marks the run as an error with a clear message and records evaluation.failed instead of throwing.
  - Alerts: raiseAlert inserts an alert plus an alert.raised audit entry in one transaction. Monitoring turns a flagged output (for example a likely email address) into a policy breach alert per agent, and an evaluation that scores below its pass mark raises an evaluation failure alert. The Alerts screen shows these and Acknowledge and Resolve work.
- Critical audit chain fix: the audit hash was order sensitive (JSON.stringify) while the data column is JSONB, so obligations.generated and alert.raised rows failed re-verification even though nothing was tampered. Fixed with a canonical stableStringify that sorts object keys, a versioned hash (hash_version column, CURRENT_HASH_VERSION = 2, each row verified with the formula that signed it), a db:resign maintenance script, a demo re-seed, and pnpm db:verify now runs verifyAuditChain and fails on a broken chain. Fresh orgs, the demo org, the Audit page, and generated audit reports all verify as intact.
- Testing pass: Playwright e2e with Clerk sign in tokens (5 of 5 passing): the full signed in journey through the real UI and empty states on every dashboard page, plus axe scans. Lighthouse on the marketing homepage: accessibility 100 and SEO 100 after fixing button and text contrast. axe: zero serious or critical WCAG 2 A and AA violations on the homepage, sign in, and the signed in dashboard, after fixing breadcrumb list structure, button names on the org switcher and account menu, and badge and muted text contrast.

## Testing

- Unit: `pnpm test` (Vitest), 19 of 19 pass. Suites: rules, audit-hash (includes a regression test that the same data hashes the same across a JSONB style key reorder), embedding-fallback.
- End to end: `pnpm test:e2e` (Playwright), 5 of 5 pass. Config starts the Next dev server on port 3010 and the FastAPI evals service (uvicorn) as a second webServer. Timeouts are generous because a cold dev server compiles routes on first hit. Test env vars are documented in .env.example (E2E_CLERK_USER_EMAIL, E2E_CLERK_USER_USERNAME, E2E_CLERK_USER_PASSWORD, E2E_PORT); the suite creates the test user and a throwaway org through the Clerk backend API on each run, so no manual sign in is needed. It cleans the org rows the append only audit trigger allows.
- Accessibility: axe runs inside the Playwright suite (e2e/a11y.spec.ts) over the homepage, sign in, and the signed in dashboard, and fails on serious or critical violations.
- Lighthouse was run manually against a production build (next start) using a headless Chrome on a debugging port. It is not wired into CI. On Windows, chrome-launcher hit a temp dir permission error, so the working recipe is to launch Chrome yourself with --remote-debugging-port and run `lighthouse --port`, and to quote --only-categories so PowerShell does not split the comma list.

## Verification state (all green as of this handoff)

tsc --noEmit clean. oxlint 0 errors (about 30 warnings, all no-console in CLI scripts and test files, which is expected). pnpm test 19 of 19. pnpm test:e2e 5 of 5. Production build compiles (71 of 71 pages). pnpm db:verify passes and chain checks. No em dashes. .env stays gitignored and untracked.

## Known minor issue

- During the journey the dev server logs a caught "Unhandled route error SyntaxError: Unexpected end of JSON input" from a route that calls request.json() on an occasionally empty body. It is caught by handleRoute, returns cleanly, and does not affect any passing test. Harmless, worth a small guard later (parse the body defensively or skip parsing when there is no content).

## NEXT PHASE: deployment

Goal: ship Veydria to a single AWS EC2 host with automatic HTTPS. Do not touch product code beyond what deployment needs. There is initial deploy scaffolding from phase 8 (Dockerfile, docker-compose.yml, DEPLOY.md at the repo root); the production phase replaces or extends it with the following.

- Containers and compose (production docker-compose):
  - web: the Next.js app. Build with BUILD_STANDALONE=true for the standalone output, run as a non root user, expose 3000 internally only.
  - db: Postgres with pgvector (for example the pgvector/pgvector:pg18 image or equivalent), a named volume for data, healthcheck on pg_isready.
  - evals: the FastAPI service in services/evals, its own Dockerfile, X-API-Key from EVALS_SERVICE_API_KEY, expose 8000 internally only.
  - caddy: Caddy as the edge reverse proxy for automatic HTTPS via Let's Encrypt. Route the apex and www to web:3000, terminate TLS, redirect 80 to 443. Persist Caddy data and config volumes.
  - Keep secrets out of the images. All config comes from .env.production on the host.
- .env.production (on the host only, never committed): DATABASE_URL pointing at the db service, real Clerk pk_live and sk_live plus the production CLERK_WEBHOOK_SECRET, EVALS_SERVICE_URL=http://evals:8000 and EVALS_SERVICE_API_KEY, AUDIT_LOG_SECRET (a strong unique value, not the dev default), NEXT_PUBLIC_APP_URL set to the real domain, and any Stripe, Langfuse, PostHog, Resend, Sentry keys that are actually used.
- Production Clerk: create a production instance, add the domain, set pk_live and sk_live in .env.production, configure the Clerk webhook to the production URL, and confirm the keyless widget never appears.
- AWS EC2 target: Ubuntu Server 24.04 LTS (the plain server image, NOT the Deep Learning AMI), root volume 40 GiB gp3. Security group inbound: 22 from my IP only, 80 from anywhere, 443 from anywhere. Install Docker Engine and the compose plugin, clone or copy the repo, place .env.production, then bring the stack up.
- First boot: run migrations and seed only the regulations knowledge base, with NO demo data. That is `pnpm db:migrate` (or a container that runs tsx src/db/migrate.ts) which applies migrations, installs the cosine function and the audit trigger, and idempotently seeds the regulation clauses. Do not run pnpm db:seed in production (it truncates and loads the Northwind demo tenant). If native pgvector is wanted, migrate the embedding columns from real[] to vector and swap the similarity SQL; the helper is isolated in src/db/vector.ts.
- DEPLOY.md runbook: write a step by step runbook at the repo root covering launch of the EC2 instance, security group, Docker install, env file placement, docker compose up, first boot migrate and regulations seed, DNS records, Caddy domain config, health checks, and how to update (pull, rebuild, migrate, restart). Keep it human and specific.

## Git and backup

- Clean history on branch main. Local commit identity is Veydria <dev@veydria.com> (repo scoped, global config untouched).
- The repository is published to the private GitHub remote origin at https://github.com/devpilotX/Veydria.git (default branch main), pushed with full history and all tags. Keep a local snapshot with `git bundle create veydria-backup.bundle --all` (the bundle is gitignored). Restore with `git clone veydria-backup.bundle restored-veydria`.
- Commit conventions: no em dashes, human messages, commit after each meaningful unit. Pre-commit hook runs `pnpm exec lint-staged` (oxfmt). Pre-push runs `pnpm run lint`.

## Recent commit trail (newest first)

7dd2521 Wait for the evaluation request before asserting the detail page
eabe4de Fix accessibility violations found by axe
72bb72c Fix color contrast so text and buttons meet WCAG AA
0c36b11 Add Playwright e2e for the signed in journey and empty states
b0f3a4b Make db:verify fail when the audit chain does not verify
47fab06 Add a maintenance script to re-sign audit chains in place
e3e6298 Record the hash formula version on every audit row
f171aca Hash audit rows with a stable serialization that ignores key order
ef826b8 Let the new agent form set the initial status
7facb18 Raise alerts automatically from flagged events and failed evaluations
4ed34dc Add UI to run evaluations and see their results
ce16e6d Add UI to create, edit, and delete agents
114eeb3 Add a session handoff document
025dab7 Record an obligations.generated audit entry with framework breakdown
12b6d63 Verify a fresh org provisions and classifies against the global KB
d58e240 Show the classification result after creating a system
78f21ea Seed the regulations knowledge base in every environment
6bf0679 Make creating and classifying a system one atomic step
49f829d Rebuild the marketing homepage and remove invented content
8262e2f Rebrand the product to Veydria
(earlier commits cover phases 0 through 8, the Clerk link, the marketing and legal build, hardening, deploy scaffolding, logo and favicon polish, and the local demo access change)

## How to resume quickly

1. Read this file (HANDOFF.md). README.md and DEPLOY.md have more background.
2. Run `pnpm db:verify` to confirm the core loop and the audit chain are intact.
3. Run `pnpm dev` and sign in through Clerk (dev keys are in .env). The demo org has data.
4. Continue with the deployment phase above. Follow the commit and no em dash conventions.



## Session 2026-07-23: live audit, fixes, and current truth

This session audited the live product end to end, fixed a short list of truthfulness and SEO issues, redeployed, and refreshed the docs. Full audit detail is in AUDIT.md under "Post-deployment live audit (2026-07-23)".

### Live deployment (this is the real state now)

- Host: one AWS EC2 instance, Ubuntu, internal name ip-172-31-26-145, reachable at 3.225.213.205. SSH is limited to the owner's IP by the security group (sg-001d0b58c8eafed7a). Add a client IP to port 22 there to allow SSH.
- URL: https://veydria.devpilotx.com. This is a subdomain of the agency domain. Moving to a real brandable root domain is the biggest SEO lever and helps trust.
- Containers (docker compose): veydria-web-1, veydria-postgres-1 (pgvector/pgvector:pg16), veydria-evals-1, veydria-caddy-1 (caddy:2, the only one publishing ports 80 and 443). All healthy.
- Repo on host: /home/ubuntu/veydria. Config in /home/ubuntu/veydria/.env.production (mode 600, gitignored, never in the repo). Do not print or commit it.
- Production Clerk: live keys, custom frontend domain clerk.veydria.devpilotx.com, Google and GitHub SSO both enabled. Not keyless.
- Database: name agentproof, user postgres. Reach it read only with: docker exec veydria-postgres-1 psql -U postgres -d agentproof (local socket trust, no password needed inside the container).

### Deploy and de-drift recipe (used this session, repeat for future deploys)

The host git remote "origin" is a local bundle at /home/ubuntu/veydria-deploy.bundle, not GitHub (the host has no GitHub credentials). To deploy new commits:

1. Push to GitHub main from local as usual.
2. Locally: git bundle create veydria-deploy.bundle --all
3. Copy it up: scp -i veydria-key.pem veydria-deploy.bundle ubuntu@3.225.213.205:/home/ubuntu/veydria-deploy.bundle
4. On host: cd ~/veydria && git fetch origin && git reset --hard origin/main   (this also de-drifts the working tree; .env.production is gitignored so it is untouched)
5. On host, only when app code changed: docker compose --env-file .env.production up -d --build   (Caddy waits for web health; downtime is a brief blip)
6. Verify: docker ps, then fetch the live pages.

Note: the web image bakes NEXT_PUBLIC_* at build time (build args in docker-compose from .env.production). Server secrets are read at runtime from .env.production. Doc-only commits (like HANDOFF and AUDIT) do not need a rebuild.

De-drift done this session: the host was at an older commit plus uncommitted working tree edits, with a stale bundle origin. After the fixes it was reset hard to origin/main and rebuilt, so host git equals origin equals the running image. Clean.

### Verified feature status (summary; detail in AUDIT.md)

Works and verified live: auth and both SSO providers, org creation and the four roles, AI system create and classify (high risk gives 18 obligations), obligations and status changes, the regulations library (3 frameworks, 18 clauses), agents full CRUD, monitoring ingest and the flagged to alert path, alerts, documents from real data, the append only hash chained audit log and its verify, API key create and revoke, multi-tenant isolation, and usage caps. Marketing and legal pages all load and are now truthful.

Real logic versus placeholder: classification, obligations, the audit log and its hash chain, monitoring, alerts, and document generation are real. Evaluation scoring is a deterministic placeholder (see limitations).

### Known limitations and roadmap

- Evaluation scoring is a placeholder. services/evals/app/scoring.py returns a fixed score from keyword checks plus a hash based jitter and never calls the agent's model. There is no model-grading path, only a comment. A language model key alone will not change scores. Build the model-grading step to make evaluations real. This is the top roadmap item.
- No LLM key is set, so the provider gateway does not call any model in production.
- AI systems have no edit or delete button in the screen, although the service and API support both.
- Billing is off on purpose.
- The regulation library is a focused set of 18 key clauses, not the full text of the frameworks.
- Sentry is present but disabled.

### Data reality and the throwaway test org

- The live database has only two organizations, both created 2026-07-22 with one member each: the founder's own org (a little test data) and one empty org. There are no real enterprise customers. The product is pre-users and pre-revenue. Any pitch or report must say so.
- For live write tests this session, a clearly labelled throwaway org was created: name "ZZZ Audit Throwaway (safe to delete)", clerk_org_id org_audit_throwaway_1784828184. Its injected API key was revoked. It holds a couple of monitoring events, one alert, and audit rows. It is isolated and does not affect the two real orgs.
- Cleanup note: this org cannot be deleted by a plain cascade because the append only trigger blocks deleting its audit rows. To remove it fully, run in one transaction: ALTER TABLE audit_log DISABLE TRIGGER (the block trigger), delete the org (cascade clears children), ALTER TABLE audit_log ENABLE TRIGGER. That briefly disables the audit protection, so do it only with the owner's explicit approval, scoped to this org.

### Sentry advice (not wired, owner decides)

Sentry code exists but is off (NEXT_PUBLIC_SENTRY_DISABLED defaults to true, and there is no DSN). Sentry has a free Developer tier that gives a DSN, so no paid plan is needed to start. To enable: create a free Sentry project, set NEXT_PUBLIC_SENTRY_DSN and NEXT_PUBLIC_SENTRY_DISABLED=false in .env.production (optionally SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN for source maps), then rebuild because the public values are baked at build time. For a compliance product, also set sendDefaultPii to false and the trace sample rate to about 0.1 in src/instrumentation.ts, and Sentry is already listed on the subprocessors page as "when enabled".

### EU AI Act timeline (use the accurate version in any copy or pitch)

The Act is in force. Prohibited practices apply since February 2025. General purpose AI rules apply since August 2025. Transparency duties (Article 50) apply from 2 August 2026. The high-risk Annex III duties (hiring, credit scoring, and similar) were deferred from 2 August 2026 to 2 December 2027 under the 2026 Digital Omnibus, and AI embedded in regulated products moves to 2 August 2028. Do not describe a hard August 2026 high-risk deadline. The homepage wording "phasing in through 2026 and 2027" is accurate.

### Recent commit trail (newest first)

10fa9c9 Replace illustrative customers with an honest early design partner page
6c4ae23 Remove the SOC 2 badge the product does not implement
fa565c2 List AWS as the hosting subprocessor instead of Vercel
aae5f88 Drop nonexistent social profiles from Organization structured data
878d8c8 Point the homepage product mock at the real domain
4453008 Raise the free plan limits for early access exploration
(earlier commits: usage caps and plan limits, notifications empty state, Clerk webhook secret fix, post auth redirect, and the self hosted production deployment on AWS EC2 with Caddy)
