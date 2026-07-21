# Contributing to Veydria

Veydria is proprietary software. Contributions come from the team and from
partners who have signed access. This guide keeps the history clean and the
checks green.

## Before you start

- Read `HANDOFF.md` for the current state of the project and the working
  conventions.
- Install the toolchain: Node 20 or newer (the repo pins Node 22 in `.nvmrc`),
  pnpm, and PostgreSQL 16 or newer. For the evaluation service you also need
  Python 3.11 or newer.
- Run `pnpm install`, copy `.env.example` to `.env`, and confirm the app boots
  with `pnpm dev`.

## Branching

- `main` is always releasable. Do not commit to it directly.
- Branch off `main` with a short, descriptive name:
  - `feat/short-description` for a feature
  - `fix/short-description` for a bug fix
  - `chore/short-description` for tooling, docs, or cleanup
- Keep a branch focused on one change. Small branches review faster.

## Commit style

- Write in the imperative and describe the change, for example
  "Add the run evaluation button to the agent page".
- One logical change per commit. Commit after each meaningful unit.
- Never use the em dash character anywhere, in code, comments, copy, or commit
  messages. Use a comma, a period, or parentheses instead.
- Do not commit secrets. The `.env` files are ignored on purpose. Only the
  `.env.example` and `.env.production.example` templates are tracked.

## Before you open a pull request

Run the full local gate and make sure it is green:

```bash
pnpm exec tsc --noEmit   # types
pnpm lint                # oxlint
pnpm test                # unit tests (Vitest)
pnpm build               # production build
```

For changes that touch the signed in flows, also run the end to end suite:

```bash
pnpm test:e2e            # Playwright, needs Clerk dev keys in .env
```

For database changes, run `pnpm db:verify` to confirm the core loop and the
audit chain still pass.

If you stopped a dev server and a build then fails on stale types, remove the
Next cache first (`Remove-Item -Recurse -Force .next` on PowerShell, or
`rm -rf .next` elsewhere) and build again.

## Pull requests

- Fill in the pull request template.
- Describe what changed, why, and how you tested it.
- Link any related issue.
- A pull request should be green in CI before review. CI runs the type check,
  lint, unit tests, and a production build on every push and pull request.

## Code style

- TypeScript throughout. Formatting is handled by oxfmt and enforced by a
  pre-commit hook, so you do not need to format by hand.
- Match the existing patterns: a service layer per feature, Drizzle for data
  access, and the shared UI primitives under `src/components`.
