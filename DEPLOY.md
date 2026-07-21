# Deploying Veydria

Veydria has two deployable pieces:

1. The Next.js web app (dashboard, API routes, marketing, legal). Runs well on Vercel, or anywhere that runs a Node server.
2. The Python FastAPI evaluation service in `services/evals`. Runs as a container on Fly, Render, Cloud Run, Railway, or ECS.

They talk over HTTP. The web app calls the evals service with `EVALS_SERVICE_URL`.

## Before you start

Set up these accounts and note the keys. All of them are optional for a first deploy except the database, since the app degrades gracefully when a provider is missing.

- A managed PostgreSQL 16 or newer database (Neon, Supabase, or RDS all work).
- Clerk, for auth, organizations, and billing.
- Stripe, if you want checkout and the billing portal.
- Resend, for transactional email.
- An LLM provider key (OpenAI, Anthropic, or Google) if you want real embeddings and model graded evaluations.
- PostHog and Langfuse, if you want analytics and tracing.

Every variable is documented in `.env.example`.

## Step 1: Database

Create the database, then run the migrations against it from your machine:

```bash
export DATABASE_URL="postgresql://user:password@host:5432/agentproof"
pnpm db:migrate
# Optional, load demo data:
pnpm db:seed
```

`db:migrate` also installs the cosine similarity function and the audit log immutability trigger.

### About pgvector

Embeddings are stored as `real[]` columns and search runs through a SQL cosine function, so no vector database is needed. If your Postgres has pgvector and you want native vector indexes, install the extension, switch the embedding columns to the `vector` type, and update the helper in `src/db/vector.ts`. Nothing else changes.

## Step 2: Web app on Vercel

1. Push the repository to GitHub and import it in Vercel.
2. Framework preset: Next.js. No custom build command is needed.
3. Add the environment variables from `.env.example`. At a minimum set `DATABASE_URL` and `NEXT_PUBLIC_APP_URL`. Add Clerk, Stripe, Resend, and provider keys as you enable them.
4. Set the production Clerk keys so keyless mode never runs. Put `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_live_...`) and `CLERK_SECRET_KEY` (`sk_live_...`) from your Clerk production instance into the host environment. With these set, the "Configure your application" keyless widget does not appear, and the dashboard requires a real session.
5. Deploy. The marketing and legal pages are server rendered and crawlable, and the sitemap is served at `/sitemap.xml`.

For a self hosted Node deploy instead of Vercel, set `BUILD_STANDALONE=true` and use the root `Dockerfile`, which produces a standalone server started with `node server.js`.

## Step 3: Evaluation service

Build and run the container:

```bash
cd services/evals
docker build -t veydria-evals .
docker run -p 8000:8000 -e EVALS_SERVICE_API_KEY=choose-a-strong-key veydria-evals
```

Deploy that image to your container host, then set two variables on the web app:

- `EVALS_SERVICE_URL`: the public URL of the service, for example `https://evals.yourdomain.com`.
- `EVALS_SERVICE_API_KEY`: the same key you gave the service.

When these are set, running an evaluation from the dashboard scores it through the service and stores the result. Without them, evaluations stay queued.

## Step 4: Webhooks

### Clerk

In the Clerk dashboard, add a webhook pointing at `https://yourdomain.com/api/webhooks/clerk` for the user, organization, and organizationMembership events. Put the signing secret in `CLERK_WEBHOOK_SECRET`. This keeps the local mirror of users, organizations, and roles in sync.

### Stripe

Add a webhook pointing at `https://yourdomain.com/api/webhooks/stripe` for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`. Put the signing secret in `STRIPE_WEBHOOK_SECRET`. Set a Stripe price id for each paid plan with `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, and `STRIPE_PRICE_SCALE`.

## Local full stack with Docker

To run everything together on your machine:

```bash
docker compose up --build
# In another shell, once Postgres is healthy:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agentproof" pnpm db:migrate
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agentproof" pnpm db:seed
```

The web app is on http://localhost:3000 and the evals service on http://localhost:8000.

## Health checks

- Web app: any page, or `GET /api/audit/verify` with a session.
- Evals service: `GET /health` returns `{"status":"ok"}`.

## Rollbacks and backups

Keep a snapshot before large releases:

```bash
git bundle create veydria-backup.bundle --all
```

Managed Postgres providers offer point in time restore. Turn it on for production.
