# ADR-0001: Monorepo with a separate Next.js frontend and Hono backend

- Status: Accepted
- Date: 2026-10-16
- Deciders: @Laaloz

## Context

- The product is a live plan that users change through chat and UI. Every change must pass one validated mutation pipeline, users must be isolated from each other (RLS), and the LLM may only propose changes.
- The owner wants the frontend and backend in separate folders for a clear structure, the latest Next.js, and a deployment that is as effortless as possible.
- Data stays in the EU where possible (GDPR). The Supabase project already exists in eu-west-1 (Ireland).
- The same API should later serve an MCP App, ChatGPT app or Claude connector (ADR-0002) and possibly B2B clients.

## Decision

- **One repository, one pnpm workspace:**
  - `apps/frontend`: Next.js 16.4 (App Router, Cache Components, Turbopack), React 19.3, Tailwind CSS 4. UI only.
  - `apps/backend`: Hono 4 API deployed as Vercel Functions (zero-config Hono, entry `src/index.ts`), served locally with `@hono/node-server`.
  - `packages/contracts` (Zod API schemas) and `packages/domain` (pure plan logic), compiled with `tsc` to `dist/` so that Next.js, Vercel Functions, Vitest and tsx all consume plain ESM.
- **One origin for the browser.** `next.config.ts` rewrites `/api/*` to `BACKEND_URL`, so the main path needs no CORS; the backend still enforces an origin allowlist. The frontend sends the Supabase access token as a Bearer header and the backend verifies it with `getClaims()`.
- **Hosting:** two Vercel projects from this repository (Root Directory `apps/frontend` and `apps/backend`), functions pinned to `dub1` (Dublin) next to Supabase eu-west-1. Model traffic moves to an EU-resident endpoint before the public beta.
- **Tooling:** Node 24 LTS (22.12+ supported); pnpm 10.34.7 pinned in `packageManager`, because Vercel supports pnpm 6–10 without experimental Corepack; TypeScript 5.9, because typescript-eslint supports TypeScript below 6.1; ESLint 9, because the React, jsx-a11y and import plugins used by eslint-config-next do not support ESLint 10 yet; Vitest 5; Prettier.
- **Supply chain:** `minimumReleaseAge: 1440`, `trustPolicy: no-downgrade` for releases from the last 30 days, `blockExoticSubdeps`, `strictDepBuilds` with an empty install-script allowlist, Dependabot with a seven-day cooldown, and GitHub Actions pinned to commit SHAs. Exceptions name exact versions and are temporary: Next.js 16.4.2 is exempt from the release-age gate until 2026-10-17.

## Alternatives considered

- **One Next.js app with Server Actions and route handlers** (the original recommendation): one deployment and less wiring, but UI and data code mix, every Server Action is an implicit public endpoint, and a later API for MCP or B2B would be a second surface to secure.
- **Separate repositories:** independent releases, but shared types drift and cross-cutting changes need two pull requests.
- **Turborepo:** caching and a task graph; unnecessary at this size and one more tool. Revisit when builds get slow.
- **Backend on Fly.io, Railway or Cloud Run:** long-running processes, but a second platform. Vercel keeps previews per pull request, and Fluid compute supports streaming responses.
- **pnpm 11:** newest, but Vercel needs the experimental Corepack flag for it.

## Consequences

- Two Vercel projects and two sets of environment variables. `BACKEND_URL` must be set on the frontend project at build time; the build fails on Vercel without it.
- Every data feature needs a contract in `packages/contracts`, a backend route and a frontend call: more files, clearer boundaries.
- Packages must be built before the apps are type-checked or tested. Root scripts do this; revisit with TypeScript project references or Turborepo if it becomes a bottleneck.
- Long AI responses stream through the Vercel rewrite. Measure latency and timeouts in Phase 1, and call the backend directly with CORS if the rewrite limits streaming.
- Revisit pnpm 11, ESLint 10 and TypeScript 7 once Vercel, eslint-config-next and typescript-eslint support them.
- Nothing is deployed yet. The first deployment verifies the Hono zero-config entry, the `vercel.json` build commands and the `dub1` region.
