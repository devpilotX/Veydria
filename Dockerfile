# Multi stage build for the Veydria web app using pnpm and Next standalone.

ARG NODE_VERSION=24-slim

# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:${NODE_VERSION} AS dependencies
WORKDIR /app

RUN npm install -g pnpm@11.15.1

# Copy the files pnpm needs to resolve and build the dependency tree.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# strict-dep-builds=false so a fresh container install does not fail on the
# build-script approval gate. The app does not need those optional scripts on
# linux-x64: sharp and esbuild load prebuilt platform binaries, sentry-cli is
# unused with Sentry disabled, and the Next build runs on Turbopack.
RUN pnpm install --frozen-lockfile --config.strict-dep-builds=false

# ============================================
# Stage 2: Build the app
# ============================================
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

RUN npm install -g pnpm@11.15.1

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILD_STANDALONE=true

# Public client env must be present at build time because Next inlines every
# NEXT_PUBLIC_* value into the browser bundle. Server secrets are never baked in;
# they are provided at runtime through the container environment.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SENTRY_DISABLED=true
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SENTRY_DISABLED=$NEXT_PUBLIC_SENTRY_DISABLED

RUN pnpm build

# ============================================
# Stage 3: Migrator (one off tool)
# Applies migrations, installs the cosine function and audit trigger, and seeds
# the global regulations knowledge base. No demo data. Skips the Next build.
# ============================================
FROM node:${NODE_VERSION} AS migrator
WORKDIR /app

RUN npm install -g pnpm@11.15.1

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
CMD ["pnpm", "db:migrate"]

# ============================================
# Stage 4: Run
# ============================================
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder --chown=node:node /app/public ./public
RUN mkdir .next && chown node:node .next
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000
CMD ["node", "server.js"]
