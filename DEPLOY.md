# Deploying Veydria

Veydria ships as a small stack: the Next.js web app, a Postgres database with
pgvector, the Python FastAPI evals service, and Caddy as the HTTPS edge. The
recommended production setup is a single server running all four with Docker
Compose. A managed alternative on Vercel plus a managed Postgres is described at
the end.

Every variable is documented in `.env.example` (development) and
`.env.production.example` (production). Secrets live only in `.env.production`
on the host. Never commit that file.

## Self hosted production on one server (Docker Compose and Caddy)

This is the path used for veydria.devpilotx.com. It runs everything on one host
behind Caddy, which gets and renews a Let's Encrypt certificate automatically.

### 1. Server and DNS

- A Linux host, for example Ubuntu 24.04 on AWS EC2. An m7i-flex.large with 8
  GiB of RAM is comfortable for the build and the running stack.
- An Elastic IP or other stable public IP.
- Security group inbound: 22 from your IP only, 80 from anywhere, 443 from
  anywhere. Nothing else needs to be open, because the app, database, and evals
  service are only reachable on the internal Docker network.
- A DNS A record for your domain pointing at the public IP. If Cloudflare sits
  in front, set the record to DNS only (grey cloud) so Caddy can complete the
  ACME challenge and terminate TLS itself.

### 2. Install Docker and the compose plugin

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Log out and back in so the docker group applies, then confirm with `docker
version` and `docker compose version`.

### 3. Get the code onto the server

Use a short lived deploy token or an SSH deploy key, and do not hardcode any
secret. With a fine grained token that has read access to the private repo:

```bash
git clone https://x-access-token:TOKEN@github.com/devpilotX/Veydria.git veydria
cd veydria
```

Revoke the token after cloning, and pull later updates with a fresh token or a
deploy key. If you prefer not to use a token at all, create a git bundle on your
machine with `git bundle create veydria.bundle --all`, copy it up with `scp`,
and `git clone veydria.bundle veydria` on the server.

### 4. Create `.env.production` on the host

Copy the template and fill in real values. Generate strong secrets on the
server so they never travel anywhere:

```bash
cp .env.production.example .env.production
# Generate secrets and keep them only in this file:
openssl rand -hex 24   # use for POSTGRES_PASSWORD (also put it in DATABASE_URL)
openssl rand -hex 48   # use for AUDIT_LOG_SECRET
openssl rand -hex 24   # use for EVALS_SERVICE_API_KEY
```

Then edit `.env.production` and set at least:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (agentproof), and
  `DATABASE_URL` using the same password and the `postgres` service host, for
  example `postgresql://postgres:THEPASSWORD@postgres:5432/agentproof`.
- `AUDIT_LOG_SECRET` to the long random value. The app refuses to start in
  production if this is empty or the development default.
- `EVALS_SERVICE_URL=http://evals:8000` and `EVALS_SERVICE_API_KEY` to the
  generated value.
- `NEXT_PUBLIC_APP_URL` to your real HTTPS URL, for example
  `https://veydria.devpilotx.com`.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`. Use the production
  Clerk instance keys (`pk_live_` and `sk_live_`) for a real launch. Test keys
  work for a first verification deploy.
- `NEXT_PUBLIC_SENTRY_DISABLED=true` unless you have set a Sentry DSN.

Lock the file down: `chmod 600 .env.production`.

### 5. Run migrations and seed the regulations knowledge base

Start the database, then run the one off migrate tool. This applies migrations,
installs the cosine function and the append only audit trigger, and seeds the
global regulations knowledge base. It does not load any demo or tenant data.

```bash
docker compose --env-file .env.production up -d postgres
docker compose --env-file .env.production --profile tools run --rm --build migrate
```

Do not run `pnpm db:seed` in production. That truncates and loads the demo
tenant, which is only for local development.

### 6. Build and start the stack

```bash
docker compose --env-file .env.production up -d --build
```

Caddy obtains the certificate on first start. The app, Postgres, and evals are
internal only. Caddy is the only service that listens on the host, on 80 and
443.

### 7. Verify

```bash
docker compose ps                     # every service up, web and evals healthy
docker compose logs -f caddy          # look for a certificate obtained for the domain
curl -I https://veydria.devpilotx.com # expect HTTP 200 and a valid certificate
```

Open the site in a browser, confirm the padlock, and sign in through Clerk.

### Logs, restart, and updates

```bash
# Logs
docker compose logs -f            # all services
docker compose logs -f web        # just the app
docker compose logs -f caddy      # HTTPS and proxy

# Restart
docker compose --env-file .env.production restart web
docker compose --env-file .env.production up -d      # recreate any changed service
docker compose down               # stop everything (volumes and certs are kept)

# Update to a new release
git pull
docker compose --env-file .env.production --profile tools run --rm --build migrate
docker compose --env-file .env.production up -d --build
```

### About pgvector

The schema stores embeddings as `real[]` columns and searches with a SQL cosine
function, so the app runs on plain Postgres. The image here includes pgvector,
so switching to native vector indexes later is a migration of the embedding
columns to the `vector` type plus a swap of the similarity SQL in
`src/db/vector.ts`. Nothing else changes.

## Managed alternative: Vercel plus managed Postgres

1. Create a managed PostgreSQL 16 or newer database (Neon, Supabase, or RDS).
   Run `pnpm db:migrate` against it once from your machine with `DATABASE_URL`
   set. This installs the cosine function, the audit trigger, and the
   regulations knowledge base. Do not run `pnpm db:seed` in production.
2. Import the repo in Vercel with the Next.js preset. Add the environment
   variables from `.env.production.example`, at least `DATABASE_URL`,
   `NEXT_PUBLIC_APP_URL`, and the Clerk keys. With `pk_live_` and `sk_live_`
   set, the keyless widget never appears.
3. Deploy the evals service as a container (Fly, Render, Cloud Run, Railway, or
   ECS) and set `EVALS_SERVICE_URL` and `EVALS_SERVICE_API_KEY` on the web app.
   Without them, evaluations stay queued and the rest of the app works.

## Webhooks

### Clerk

Add a webhook in the Clerk dashboard pointing at
`https://yourdomain.com/api/webhooks/clerk` for the user, organization, and
organizationMembership events, and put the signing secret in
`CLERK_WEBHOOK_SECRET`. This keeps the local mirror of users, organizations, and
roles in sync.

### Stripe

Billing is deferred for the first launch and the billing page is a placeholder,
so no Stripe webhook is required yet. When you turn billing on, add a webhook at
`https://yourdomain.com/api/webhooks/stripe` for `checkout.session.completed`,
`customer.subscription.updated`, and `customer.subscription.deleted`, set
`STRIPE_WEBHOOK_SECRET`, and set a price id for each paid plan.

## Health checks

- Web app: any page, for example `GET /`, or `GET /api/audit/verify` with a
  session.
- Evals service: `GET /health` returns `{"status":"ok"}` on the internal
  network.

## Rollbacks and backups

Keep a snapshot before large releases:

```bash
git bundle create veydria-backup.bundle --all
```

For the database, back up the Postgres volume or use `pg_dump` on a schedule,
and turn on point in time restore if you move to a managed provider.
