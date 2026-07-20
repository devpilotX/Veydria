# Multi stage build for the AgentProof web app using pnpm and Next standalone.

ARG NODE_VERSION=24-slim

# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:${NODE_VERSION} AS dependencies
WORKDIR /app

RUN npm install -g pnpm@11.15.1

# Copy the files pnpm needs to resolve and build the dependency tree.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

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

# Public client env can be baked at build time. Server secrets are passed at runtime.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SENTRY_DISABLED=true

RUN pnpm build

# ============================================
# Stage 3: Run
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
