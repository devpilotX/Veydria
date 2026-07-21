# Veydria: session handoff

Living notes so the next session starts with zero context loss. Product name is Veydria (renamed from the working title AgentProof). It is a B2B SaaS that governs, tests, and documents AI agents against the EU AI Act, NIST AI RMF, and ISO 42001, built on the Kiranism next-shadcn-dashboard-starter.

Hard rules that always apply: never use the em dash character anywhere (code, comments, copy, commit messages). Keep copy human and specific. Keep the starter design language. Do not commit secrets.

## Environment (Windows, PowerShell shell)

- node 24.18.0 (installed via pnpm runtime, resolves at %LOCALAPPDATA%\pnpm\node.EXE), pnpm 11.15.1, git 2.54.0, python 3.14.6, psql (PostgreSQL) 18.4.
- The shell is PowerShell. Use `;` to chain, not `&&`. `pnpm` is a .ps1 shim. Execution policy is set to RemoteSigned for CurrentUser.
- To launch the Next dev server from the shell, do not Start-Process the pnpm shim. Use: Start-Process node with the full path to node_modules\next\dist\bin\next, args dev -p 3010. Poll the port, then stop node processes when done.
- tsx and drizzle-kit run via `pnpm exec`. The pnpm.ps1 line printed to stderr is not an error.
- pnpm gate: pnpm-workspace.yaml has onlyBuiltDependencies (sharp, esbuild, @sentry/cli, core-js) and verifyDepsBeforeRun: false. .npmrc has legacy-peer-deps, shamefully-hoist, verify-deps-before-run=false.
- STALE CACHE GOTCHA: killing the dev server can leave a corrupted .next/dev/types, which makes `next build` fail its type check or `tsc` report errors in .next/dev/types. Fix: run `Remove-Item -Recurse -Force .next` before a build or full typecheck.

## Database

- PostgreSQL 18.4 at localhost:5432, user postgres, password REDACTED. Database name is `agentproof` (kept as an internal name, not user facing, not renamed to veydria to avoid recreating the DB).
- .env DATABASE_URL = postgresql://postgres:REDACTED@localhost:5432/agentproof (.env is gitignored).
- pgvector is NOT installed (Windows admin UAC was declined). Vectors are stored as real[] columns and similarity uses a SQL function `agentproof_cosine_similarity`. Upgrade path to native pgvector is documented in README and isolated in src/db/vector.ts.
- SQL helper names stay as `agentproof_cosine_similarity` and `agentproof_block_audit_mutation` (internal, not user facing). audit_log has an append only trigger that blocks UPDATE and DELETE per row; TRUNCATE is allowed so the seed can reset.
- Commands: `pnpm db:migrate` (apply migrations, install cosine fn + audit trigger, idempotently seed the regulations KB), `pnpm db:seed` (full reset + demo tenant data), `pnpm db:seed:regulations` (KB only, idempotent), `pnpm db:verify` (core loop check in a fresh org), `pnpm db:generate`, `pnpm db:studio`, `pnpm db:push`.

## Auth (Clerk, linked)

- Real Clerk app linked via the Clerk CLI (v2.2.0, installed globally). App: Veydria, id app_3Go7x2vXw5EXmRXAQPPcloAAE3K, development instance ins_3Go7x4JhiHjGBc5axdbiFthWdPk. Logged in as dipanshukumar117@gmail.com.
- Development keys pk_test_ and sk_test_ are in the gitignored .env. Production instance is NOT configured yet; for deploy set pk_live_ and sk_live_ in the host env.
- src/proxy.ts: demoModeOpen = NODE_ENV !== 'production' && !hasClerkKeys. Keys are now present, so the dashboard requires a real sign in. The matcher includes /__clerk/:path* exactly once after /(api|trpc)(.*).
- Sign in and sign up routes are /auth/sign-in and /auth/sign-up (the .env URL vars point there; clerk init had repointed them to /sign-in and /sign-up and I reverted that; the scaffolded /sign-in and /sign-up route folders were deleted).
- To view the dashboard now you must sign in through Clerk. In development, signed in with no organization falls back to the demo org (clerkOrgId org_demo_northwind) which has the seeded data. A real Clerk org starts empty, but classification still works because the regulation knowledge base is global.
- getTenantContext in src/lib/auth/tenant.ts maps a Clerk org to a DB org via getOrCreateOrganization. Roles: owner, admin, member, viewer.

## Brand (Veydria)

- Single source of truth: src/config/brand.ts. name Veydria, tagline "Proof for every AI decision", url https://veydria.com, emails @veydria.com, twitter @veydria, legalName "Veydria" (no Inc., no fabricated address, both removed as they were invented).
- Palette: Control Blue #2457E6 (primary), Trust Navy #111C4E (text and dark surfaces), Evidence Amber #F4A62A (accent), Soft Background #F7F9FF. Tokens in src/styles/theme.css (:root light, .dark dark). There is ONE theme now; the ten preset themes and the theme picker were removed. Only a light and dark toggle remains.
- Logo: src/components/brand/logo.tsx. LogoMark is the split V (left stroke currentColor, right stroke var(--primary), amber node #F4A62A). Favicon is src/app/icon.svg plus src/app/favicon.ico, and src/app/apple-icon.png, all from the veydria-brand kit folder. OG card at src/app/api/og/route.tsx uses navy background and the split V.
- No em dashes anywhere in the repo (verified). No "AgentProof" in the UI. Lowercase "agentproof" remains only in the DB name, the two SQL function names, the JS var globalForDb.veydriaPg was renamed but the DB name and functions stay, and git history.

## Architecture map

- Schema: src/db/schema/*.ts (enums, identity = organizations/users/memberships/apiKeys, billing = subscriptions, systems = aiSystems/agents, regulations = regulations/regulationClauses/obligations, evaluations = evaluations/evaluationCases, monitoring = monitoringEvents/alerts, audit = auditLog, documents). Client src/db/index.ts (exports db, client, schema).
- Seed and tools: src/db/seed.ts, src/db/seed-regulations.ts (shared idempotent KB seeder + catalog), src/db/migrate.ts, src/db/verify-core-loop.ts, src/db/vector.ts, src/lib/audit-hash.ts, src/lib/embedding-fallback.ts.
- Auth libs: src/lib/auth/{roles,tenant,require,api-key,page}.ts. API infra: src/lib/api/{errors,handler,rate-limit}.ts.
- Services: src/server/services/{audit,ai-systems,agents,obligations,evaluations,alerts,documents,monitoring,api-keys,billing,classification,regulations,overview,shared,evals-client}.ts. Engines: src/server/engine/{rules,documents}.ts. LLM gateway: src/server/llm/gateway.ts (provider agnostic, offline fallback via pseudoEmbedding).
- API routes: src/app/api/{ai-systems (+/[id], /[id]/classify), agents, obligations, evaluations, alerts, documents, monitoring/events, ingest (api key auth), audit (+/verify), api-keys, billing, regulations, og, webhooks/clerk, webhooks/stripe, v1/{systems,obligations,audit/verify}}.
- Dashboard pages: src/app/dashboard/{overview, systems (+/[id], /new), agents, obligations, evaluations, monitoring, alerts, documents (+/[id]), audit, regulations, team, settings, billing, notifications, profile, workspaces}. Shared UI: src/components/dashboard/{stat-card,badges,empty-state}.tsx, src/features/dashboard/components/{activity-chart,action-button,new-system-form,api-keys-manager}.tsx.
- Marketing: src/app/(marketing)/{layout, page (rebuilt landing), features (+/[slug]), pricing, about, customers, integrations, docs, changelog, security, contact, careers, blog (+/[slug]), privacy, terms, dpa, cookies, acceptable-use, subprocessors, responsible-ai}. Components: src/components/marketing/{header,footer,json-ld,reveal,product-visual}.tsx.
- SEO: src/lib/seo.ts (buildMetadata), src/app/sitemap.ts, src/app/robots.ts. Config: src/config/{brand,plans,marketing}.ts, src/content/blog.ts.
- SDK: sdk/ (package @veydria/sdk, class Veydria, posts to /api/ingest). MCP: mcp/ (package @veydria/mcp, server name veydria, env VEYDRIA_API_KEY and VEYDRIA_BASE_URL). Evals service: services/evals/ (FastAPI, offline heuristic scorer, header X-API-Key = EVALS_SERVICE_API_KEY, a .venv is present, verified on py3.14).

## The core loop (works today)

Add a system, classify it, generate obligations, record in the tamper evident audit log. The New system form posts to /api/ai-systems, which calls createAndClassifyAiSystem in src/server/services/classification.ts. That one transaction inserts the system, classifies it with src/server/engine/rules.ts, builds obligations from the global regulation clauses, and appends three audit entries (ai_system.created, ai_system.classified, obligations.generated) in the same transaction. If it fails, nothing is written and the error surfaces. Verified by pnpm db:verify in a fresh org: high tier, 18 obligations, all three audit actions present.

## What is done

Phases 0 through 8 are complete: setup and branding, database, auth and RBAC and billing scaffolding, domain engines (rules, LLM gateway, vector search, document generator, SDK, MCP, FastAPI evals), dashboard pages, marketing site with full SEO, legal pages, hardening (security headers, rate limit on ingest, Vitest suite, demo screens removed), and deploy config (Dockerfile, docker-compose, DEPLOYMENT.md). Then: the marketing homepage was rebuilt into a polished landing page with real product mocks and cited regulatory facts and no invented testimonials or legal entity, the whole product was rebranded to Veydria with the brand kit, the Clerk app was linked with real dev keys, and the five core loop fixes were implemented.

## Remaining tasks and known gaps (from the functional audit)

1. Agents: no UI to create an agent. Agents exist only from the seed or a direct API call, and ingestion rejects unknown agents rather than auto registering them. Add a create agent form and route wiring, and decide whether ingestion should auto register.
2. Evaluations: no UI button to trigger an evaluation, and no detail page. The run pipeline is coded (createEvaluation queues, runEvaluation calls the FastAPI service through evals-client) but needs the Python service running (EVALS_SERVICE_URL, default http://localhost:8000) and a UI trigger. Build a Run evaluation button and an evaluations/[id] page.
3. Alerts: not generated at runtime, only seeded. Monitoring flags events with a PII regex but does not create alert rows, and failed evaluations do not raise alerts. Add rules that insert alert rows from flagged monitoring events and failing evaluations.
4. Billing: the billing page renders Clerk PricingTable and needs a Clerk org plus Clerk Billing plans configured. Our own Stripe service (checkout, portal, webhook) and the subscriptions table exist but are not wired to the UI, and no plan limits are enforced. The user asked not to touch billing in the last task, so treat this carefully.
5. AI systems: no edit or delete UI (the API routes exist).
6. Production Clerk: set pk_live and sk_live and configure a production instance before deploy so the keyless widget never appears.
7. Testing depth: only unit tests (Vitest, 16) plus the db:verify script and manual API checks. No Playwright e2e, no formal Lighthouse or accessibility audit.

## Verification state (all green as of this handoff)

tsc --noEmit clean. oxlint 0 errors (about 24 warnings, all no-console in CLI scripts like migrate, seed, seed-regulations, verify-core-loop, which is expected). pnpm test 16 of 16 pass. Production build compiles. pnpm db:verify passes. No em dashes. .env stays gitignored and untracked.

## Git and backup

- Clean history on branch main. Local commit identity is Veydria <dev@veydria.com> (repo scoped, global config untouched).
- gh CLI is NOT installed, so pushing to a private GitHub remote needs the user's credentials. Meanwhile the backup is a bundle: `git bundle create veydria-backup.bundle --all` (the bundle is gitignored). Restore with `git clone veydria-backup.bundle restored-veydria`.
- Commit conventions: no em dashes, human messages, commit after each meaningful unit. Pre-commit hook runs `pnpm exec lint-staged` (oxfmt). Pre-push runs `pnpm run lint`.

## Recent commit trail (newest first)

025dab7 Record an obligations.generated audit entry with framework breakdown
12b6d63 Verify a fresh org provisions and classifies against the global KB
d58e240 Show the classification result after creating a system
78f21ea Seed the regulations knowledge base in every environment
6bf0679 Make creating and classifying a system one atomic step
49f829d Rebuild the marketing homepage and remove invented content
8262e2f Rebrand the product to Veydria
c7791ee Document the Clerk keys and keyless to production transition
ab7fdf7 Link the Clerk app and add the Clerk internal route matcher
0c10873 Consolidate to one AgentProof brand theme
(earlier commits cover phases 0 through 8, the marketing and legal build, hardening, deploy, logo and favicon polish, and the local demo access change)

## How to resume quickly

1. Read this file and README.md and DEPLOYMENT.md.
2. Confirm the app runs: `pnpm dev`, sign in through Clerk (dev keys are in .env), or set NODE_ENV development with no keys to use the open demo. Data lives in the demo org.
3. Run `pnpm db:verify` to confirm the core loop is intact.
4. Pick a remaining task from the list above. Follow the commit and no em dash conventions.
