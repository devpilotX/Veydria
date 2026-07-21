# Veydria

Veydria is a B2B platform for governing, testing, and documenting AI agents against the EU AI Act, the NIST AI Risk Management Framework, and ISO 42001.

[![CI](https://github.com/devpilotX/Veydria/actions/workflows/ci.yml/badge.svg)](https://github.com/devpilotX/Veydria/actions/workflows/ci.yml)

## The problem

Teams ship AI agents faster than they can govern them. The new rules (the EU AI Act, the NIST AI RMF, ISO 42001) ask an organization to inventory its AI systems, classify each one by risk, test it, watch it in production, and produce evidence when an auditor asks. Most teams track this in spreadsheets and screenshots. That does not scale, and it does not hold up in a review.

Veydria turns that manual work into a system of record. It connects to your AI systems, maps each one to the obligations that actually apply, runs automated tests, streams production activity into a tamper evident audit log, and generates the documents an auditor asks for.

## What Veydria does

Five jobs, one loop.

1. **Discover.** Connect your AI systems and agents through API keys, a TypeScript SDK, or an MCP server. Veydria builds an inventory of every model, agent, prompt, and data flow.
2. **Classify.** A rules engine maps each system to the regulations that apply and returns the exact obligations, including its EU AI Act risk tier.
3. **Evaluate.** Automated tests score each agent for bias, hallucination, prompt injection, safety, and policy violations.
4. **Monitor.** In production an SDK streams every agent action into an append only, hash chained audit log. Anomalies and policy breaches raise alerts.
5. **Prove.** The platform generates the documents auditors ask for: risk assessments, Annex IV technical files, model cards, and audit reports.

The core loop is one atomic step. Adding a system classifies it, generates its obligations from the global regulation clauses, and records three audit entries in a single database transaction. If any part fails, nothing is written.

## Screenshots

The product screens live under `/dashboard` once you are signed in. Exported images are not committed to keep the repository small. To add them, drop PNGs into `docs/screenshots/` and link them here. The screens worth capturing are:

- Overview: the portfolio of AI systems with risk tiers and open obligations.
- System detail: classification result and the obligations generated for it.
- Evaluations: a run with its score against the pass threshold and per case results.
- Audit log: the append only, hash chained trail with a verify action.
- Documents: a generated Annex IV technical file or audit report.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript 5.7
- Tailwind CSS v4, shadcn/ui on Base UI primitives
- PostgreSQL with Drizzle ORM, vectors stored in Postgres
- Clerk for auth, organizations, and billing
- Stripe for checkout and the billing portal where Clerk Billing is not enough
- A Python FastAPI service for the evaluation pipelines (`services/evals`)
- Langfuse for LLM observability, PostHog for product analytics
- Resend with React Email for transactional mail
- A provider agnostic LLM gateway (OpenAI, Anthropic, Google)
- An MCP server and a TypeScript SDK for connecting customer agents

Charts and metric cards are built on the starter's shadcn Card primitives and Recharts. The classic Tremor npm package pins to Tailwind v3, so on this Tailwind v4 codebase we use local Tremor style components instead. Same look, no version conflict.

## Architecture

The Next.js app is the base. The dashboard, API route handlers, marketing pages, and legal pages all live in it under `src`. The Python evaluation service lives in `services/evals` in the same repository so everything is in one place.

- Data layer: Drizzle schema in `src/db/schema`, one file per domain area. Access goes through a service layer per feature (`api/types.ts`, `api/service.ts`, `api/queries.ts`).
- Audit log: an append only table where each row stores the hash of the previous row, so entries cannot be changed without breaking the chain. The hash uses a canonical serialization that ignores JSON key order, and each row records the hash formula version that signed it.
- RBAC: Owner, Admin, Member, and Viewer, backed by Clerk Organizations.
- LLM gateway: a small provider agnostic wrapper so any model can be swapped by configuration.
- Secrets live in environment variables and are never committed.

## Project structure

```
.
├── src/
│   ├── app/               Next.js App Router
│   │   ├── api/           Route handlers (systems, agents, evaluations, audit, ingest, webhooks, v1)
│   │   ├── dashboard/     Signed in product screens
│   │   ├── (marketing)/   Public marketing and legal pages
│   │   └── auth/          Clerk sign in and sign up
│   ├── components/        Shared UI, brand, dashboard, and marketing components
│   ├── config/            Brand, plans, and marketing config (brand.ts is the single source of truth)
│   ├── db/                Drizzle client, schema, migration tooling, seed and verify scripts
│   │   └── schema/        One file per domain area
│   ├── features/          Feature specific UI (forms, managers)
│   ├── lib/               Auth, API infra, audit hash, SEO, embedding fallback
│   ├── server/            Services, engines (rules, documents), and the LLM gateway
│   └── styles/            Theme tokens
├── drizzle/               Generated SQL migrations and snapshots
├── services/evals/        Python FastAPI evaluation service
├── sdk/                   TypeScript SDK (@veydria/sdk)
├── mcp/                   MCP server (@veydria/mcp)
├── e2e/                   Playwright end to end tests
├── docs/                  Internal developer notes
├── public/                Static assets
├── veydria-brand/         Brand kit (logos and favicons)
├── DEPLOY.md              Deployment runbook
├── HANDOFF.md             Session handoff and project state
└── README.md
```

## Local setup

You need Node 20 or newer (the repository pins Node 22 in `.nvmrc`), pnpm, PostgreSQL 16 or newer, and Python 3.11 or newer for the evaluation service.

1. Install dependencies.

   ```bash
   pnpm install
   ```

2. Copy the environment template and fill in the values you have. The app boots in Clerk keyless mode without auth keys, so at a minimum you only need `DATABASE_URL`.

   ```bash
   cp .env.example .env
   ```

   Every variable is documented in `.env.example` with a comment and a safe placeholder.

3. Create the database.

   ```bash
   createdb agentproof
   # or: psql -U postgres -c "CREATE DATABASE agentproof;"
   ```

   The database name stays `agentproof` for historical reasons. It is internal and never shown to users.

4. Create the tables and load demo data.

   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

   `db:migrate` applies the migrations, installs the cosine similarity function and the audit log immutability trigger, and seeds the global regulations knowledge base. `db:seed` then loads a demo tenant so the dashboard has something to show.

5. Start the web app.

   ```bash
   pnpm dev
   ```

   Open http://localhost:3000.

### Evaluation service

The Python evaluation service lives in `services/evals`. See `services/evals/README.md` for how to create a virtual environment and run it. The web app talks to it over HTTP using `EVALS_SERVICE_URL`, and authenticates with `EVALS_SERVICE_API_KEY`. Without those set, evaluations stay queued and the rest of the app works.

## Scripts

Application:

| Command       | What it does                        |
| ------------- | ----------------------------------- |
| `pnpm dev`    | Start the Next.js dev server        |
| `pnpm build`  | Production build                    |
| `pnpm start`  | Run the production build            |

Quality:

| Command             | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `pnpm lint`         | Lint with oxlint                               |
| `pnpm lint:fix`     | Fix lint issues, then format                   |
| `pnpm format`       | Format with oxfmt                              |
| `pnpm format:check` | Check formatting without writing               |
| `pnpm test`         | Run the unit tests with Vitest                 |
| `pnpm test:watch`   | Run the unit tests in watch mode               |
| `pnpm test:e2e`     | Run the Playwright end to end tests            |

Database:

| Command                   | What it does                                                                 |
| ------------------------- | ---------------------------------------------------------------------------- |
| `pnpm db:generate`        | Generate a migration from the Drizzle schema                                 |
| `pnpm db:migrate`         | Apply migrations, install the cosine function and audit trigger, seed the KB |
| `pnpm db:push`            | Push the schema to the database without a migration file                     |
| `pnpm db:studio`          | Open Drizzle Studio                                                          |
| `pnpm db:seed`            | Reset and load the full demo tenant data                                     |
| `pnpm db:seed:regulations`| Seed only the global regulations knowledge base (idempotent)                 |
| `pnpm db:verify`          | Check the core loop and verify the audit chain                               |
| `pnpm db:resign`          | Re-sign audit chains in place (one time maintenance)                         |

## Testing

- Unit tests run with Vitest (`pnpm test`). They cover the classification rules, the audit hash (including a regression test that the same data hashes the same across a JSON key reorder), and the embedding fallback.
- End to end tests run with Playwright (`pnpm test:e2e`). The suite signs in through Clerk with a server minted sign in token, walks the full signed in journey through the real UI, checks the empty state on every dashboard page, and creates a throwaway organization through the Clerk backend API on each run.
- Accessibility runs inside the Playwright suite. axe scans the homepage, the sign in page, and the signed in dashboard, and fails on any serious or critical WCAG 2 A or AA violation.
- `pnpm db:verify` provisions a fresh organization, runs the core loop, raises an alert, and verifies the audit chain. It fails if the chain is broken.

The e2e test variables (`E2E_CLERK_USER_EMAIL`, `E2E_CLERK_USER_USERNAME`, `E2E_CLERK_USER_PASSWORD`, `E2E_PORT`) are documented in `.env.example`.

## Database

- Schema: `src/db/schema`, one file per domain area (identity, billing, systems, regulations, evaluations, monitoring, audit, documents, plus shared enums). The client is `src/db/index.ts`.
- Migrations: generated SQL lives in `drizzle/`, with `meta/` snapshots and a journal. `0000` is the base schema and `0001` adds the audit log hash version column.
- Seed data: `src/db/seed.ts` loads a demo tenant (code, not a committed data dump), and `src/db/seed-regulations.ts` seeds the global regulations knowledge base that every organization classifies against. The regulations seed is idempotent and safe to run in production.
- No real tenant data and no database dump are committed. The only `.sql` files in the repository are the two schema migrations.

### About pgvector

The schema keeps embeddings inside Postgres. Native pgvector could not be installed on the Windows machine used to build this because writing the extension into the PostgreSQL program directory needs an administrator approval that was declined. To keep the app running end to end, embeddings are stored as `real[]` columns and similarity is computed with a SQL cosine distance function. No separate vector database is used.

Switching to native pgvector later is a small change. A prebuilt build that matches PostgreSQL 18.4 is available at https://github.com/andreiramani/pgvector_pgsql_windows (release `0.8.3_18.4`, file `vector.v0.8.3-pg18.zip`). Copy `vector.dll` into `PostgreSQL\18\lib`, copy the `vector*` files into `PostgreSQL\18\share\extension`, run `CREATE EXTENSION vector;`, then change the embedding columns to the `vector` type and swap the similarity SQL. The vector helper is isolated in `src/db/vector.ts` for exactly this reason.

## Deployment

See [DEPLOY.md](DEPLOY.md) for the full runbook. In short: the web app runs on Vercel or any Node host, the FastAPI evals service runs as a container, and both point at a managed Postgres. Run `pnpm db:migrate` against the production database before the first deploy, and do not run `pnpm db:seed` in production because it loads demo data.

## Tools used to build this

These are the exact versions used while building Veydria, so the setup is reproducible.

| Tool       | Version  | Notes                                    |
| ---------- | -------- | ---------------------------------------- |
| Node.js    | 24.18.0  | Installed through pnpm's runtime manager |
| pnpm       | 11.15.1  | Package manager                          |
| Git        | 2.54.0   | Version control                          |
| Python     | 3.14.6   | For the FastAPI evaluation service       |
| PostgreSQL | 18.4     | Local database                           |

## Renaming the product

The product name and all brand details live in `src/config/brand.ts`. Change `name` there and it updates across the app, emails, and documents.

## Backups

Push to the remote regularly. For a full local snapshot, use git bundle from git bash:

```bash
git bundle create veydria-backup.bundle --all
```

Restore from a bundle with:

```bash
git clone veydria-backup.bundle restored-veydria
```

## License

Veydria is proprietary software. Copyright and all rights reserved. See [LICENSE](LICENSE).

Veydria is built on the Kiranism next-shadcn-dashboard-starter, which is MIT licensed. That upstream copyright and permission notice is retained in `LICENSE` as the MIT license requires.
