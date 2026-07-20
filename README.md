# AgentProof

AgentProof is a B2B platform that helps teams govern, test, and document their AI agents against the EU AI Act, the NIST AI Risk Management Framework, and ISO 42001.

It does five jobs:

1. Discover. Connect your AI systems and agents through API keys, a TypeScript SDK, or an MCP server. AgentProof builds an inventory of every model, agent, prompt, and data flow.
2. Classify. A rules engine maps each system to the regulations that apply and returns the exact obligations, including its EU AI Act risk tier.
3. Evaluate. Automated tests score each agent for bias, hallucination, prompt injection, safety, and policy violations.
4. Monitor. In production an SDK streams every agent action into an append only, hash chained audit log. Anomalies and policy breaches raise alerts.
5. Prove. The platform generates the documents auditors ask for: risk assessments, Annex IV technical files, model cards, and audit reports.

The product is built on the Kiranism next-shadcn-dashboard-starter and keeps its design language across every screen.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript 5.7
- Tailwind CSS v4, shadcn/ui on Base UI primitives
- PostgreSQL with Drizzle ORM, vectors stored in Postgres
- Clerk for auth, organizations, and billing
- Stripe for checkout and billing portal where Clerk Billing is not enough
- A Python FastAPI service for the evaluation pipelines (services/evals)
- Langfuse for LLM observability, PostHog for product analytics
- Resend with React Email for transactional mail
- A provider agnostic LLM gateway (OpenAI, Anthropic, Google)
- An MCP server and a TypeScript SDK for connecting customer agents

Charts and metric cards are built on the starter's shadcn Card primitives and Recharts. The classic Tremor npm package pins to Tailwind v3, so on this Tailwind v4 codebase we use local Tremor style components instead. Same look, no version conflict.

## Tools installed for this project

These are the exact versions used while building AgentProof, so the setup is reproducible.

| Tool       | Version        | Notes                                             |
| ---------- | -------------- | ------------------------------------------------- |
| Node.js    | 24.18.0        | Installed through pnpm's runtime manager          |
| pnpm       | 11.15.1        | Package manager                                   |
| Git        | 2.54.0         | Version control                                   |
| Python     | 3.14.6         | For the FastAPI evaluation service                |
| PostgreSQL | 18.4           | Local database                                    |

### About pgvector

The schema keeps embeddings inside Postgres. Native pgvector could not be installed on this Windows machine because writing the extension into the PostgreSQL program directory needs an administrator approval that was declined. To keep the app running end to end, embeddings are stored as `real[]` columns and similarity is computed with a SQL cosine distance function. No separate vector database is used.

Switching to native pgvector later is a small change. A prebuilt build that matches PostgreSQL 18.4 is available at https://github.com/andreiramani/pgvector_pgsql_windows (release `0.8.3_18.4`, file `vector.v0.8.3-pg18.zip`). Copy `vector.dll` into `PostgreSQL\18\lib`, copy the `vector*` files into `PostgreSQL\18\share\extension`, run `CREATE EXTENSION vector;`, then change the embedding columns to the `vector` type and swap the similarity SQL. The vector helper is isolated in `src/db/vector.ts` for exactly this reason.

## Local setup

You need Node 20 or newer, pnpm, PostgreSQL 16 or newer, and Python 3.11 or newer.

1. Install dependencies.

   ```bash
   pnpm install
   ```

2. Create the database.

   ```bash
   createdb agentproof
   # or: psql -U postgres -c "CREATE DATABASE agentproof;"
   ```

3. Copy the environment template and fill in the values you have. The app runs in Clerk keyless mode without auth keys.

   ```bash
   cp .env.example .env
   ```

   At a minimum set `DATABASE_URL`.

4. Create the tables and load demo data.

   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

5. Start the web app.

   ```bash
   pnpm dev
   ```

   Open http://localhost:3000.

### Evaluation service

The Python evaluation service lives in `services/evals`. See `services/evals/README.md` for how to create a virtual environment and run it. The web app talks to it over HTTP using `EVALS_SERVICE_URL`.

## Scripts

| Command            | What it does                                      |
| ------------------ | ------------------------------------------------- |
| `pnpm dev`         | Start the Next.js dev server                      |
| `pnpm build`       | Production build                                  |
| `pnpm start`       | Run the production build                          |
| `pnpm test`        | Run the unit tests with Vitest                    |
| `pnpm lint`        | Lint with oxlint                                  |
| `pnpm format`      | Format with oxfmt                                 |
| `pnpm db:generate` | Generate a migration from the Drizzle schema      |
| `pnpm db:migrate`  | Apply migrations                                  |
| `pnpm db:push`     | Push the schema to the database without a file    |
| `pnpm db:studio`   | Open Drizzle Studio                               |
| `pnpm db:seed`     | Load demo data                                    |

## Architecture

The Next.js app is the base. The dashboard, API route handlers, marketing pages, and legal pages all live in it under `src`. The Python evaluation service lives in `services/evals` in the same repository so everything is in one place.

- Data layer: Drizzle schema in `src/db/schema`, one file per domain area. Access goes through a service layer per feature (`api/types.ts`, `api/service.ts`, `api/queries.ts`).
- Audit log: an append only table where each row stores the hash of the previous row, so entries cannot be changed without breaking the chain.
- RBAC: Owner, Admin, Member, and Viewer, backed by Clerk Organizations.
- LLM gateway: a small provider agnostic wrapper so any model can be swapped by configuration.
- Secrets live in environment variables and are never committed.

## Renaming the product

The product name and all brand details live in `src/config/brand.ts`. Change `name` there and it updates across the app, emails, and documents.

## Deployment

See `DEPLOYMENT.md` for the full guide. In short: the web app runs on Vercel or any Node host, the FastAPI evals service runs as a container, and both point at a managed Postgres. Run `pnpm db:migrate` against the production database before the first deploy.

## Backups

Push to the remote regularly. For a full local snapshot, use git bundle from git bash:

```bash
git bundle create agentproof-backup.bundle --all
```

Restore from a bundle with:

```bash
git clone agentproof-backup.bundle restored-agentproof
```

## License

The starter this is built on is MIT licensed. See LICENSE.
