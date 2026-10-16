# AI Planning & Shopping Assistant — instructions for Claude Code

## Product

Users describe a goal (text or image). The AI asks only the questions that matter and builds a **persistent, structured live plan**: components, budget, purchase preferences, validation. The user changes the plan through conversation or the UI; every change is a validated patch with a revision and undo. Products come only from authorised sources (mock catalog and manual entry in the MVP).

**The live plan is the product. The AI is the interface for creating and modifying it. The user stays in control.**

## Repository layout (pnpm workspace)

```
apps/frontend/        Next.js web app, UI only. Talks to the backend through the same-origin /api/* rewrite.
  src/app/            routes and layouts (thin)
  src/components/     chat/, plan/, ui/ (shadcn)
apps/backend/         Hono API on Vercel Functions: auth, plan engine orchestration, AI, data access
  src/index.ts        Vercel entry (default export). src/dev.ts serves the same app locally on :8787
  src/create-app.ts   middleware and route mounting; src/compose.ts wires the real dependencies
  src/auth/           access-token verification (getClaims) and the requireUser middleware
  src/http/           error envelope and error handling
  src/routes/         thin HTTP handlers
  src/plan/ db/ ai/ catalog/ jobs/   added as the phases need them
packages/contracts/   Zod schemas for API requests and responses, shared by both apps
packages/domain/      pure plan logic (money today; plan schema, ops, apply, budget, validators next)
supabase/             config.toml, migrations/, seed.sql
docs/                 adr/, claude-setup.md, privacy/, gates/
```

Apps import packages from their compiled `dist/`. Root scripts build the packages first; after changing a package, run `pnpm build:packages` or keep `pnpm dev` running.

## Stack

Node 24 LTS (22.12+ works) · pnpm 12 (pinned in `packageManager`, ADR-0003) · TypeScript 5.9 strict · Next.js 16.4 (App Router, Cache Components, Turbopack) · React 19.3 · Tailwind CSS 4 · Hono 4 · Zod 4 · Supabase (Auth, Postgres 17 + RLS, Storage) in eu-west-1 · Vitest 5 + fast-check · Vercel with functions in `dub1`. Added during Phase 0: shadcn/ui, next-intl (fi default, en), `@supabase/ssr`, Drizzle ORM, Playwright + axe. Phase 1: Vercel AI SDK with Claude.

## Commands (from the repo root)

| Command | Purpose |
| --- | --- |
| `pnpm dev` | backend on :8787 and frontend on :3000, packages in watch mode |
| `pnpm check` | format check, lint, typecheck and tests: run before finishing a task |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | one check across every workspace |
| `pnpm build` | builds the packages, type-checks the backend and builds the frontend |
| `pnpm format` | formats everything with Prettier |
| `pnpm --filter @app/backend test` | one workspace (also `lint`, `typecheck`) |
| `pnpm test:db`, `pnpm test:e2e`, `pnpm db:generate` | added later in Phase 0 |

The developer starts local Supabase (`supabase start`, needs Docker) in their own terminal.

## Non-negotiables

- **Architecture**: only the backend touches the database, storage writes and model providers. The frontend reaches the backend only through `/api`, sending the Supabase access token as a Bearer token. No Next.js Server Actions or route handlers for app data. `packages/domain` stays pure, and packages never import from apps.
- **Security** (`app-security-baseline`, `ai-llm-rag-security`): RLS on every table plus ownership checks in backend services. The backend authenticates with `getClaims()`, never `getSession()`. `adminDb` only in migrations, seeds and `apps/backend/src/jobs/**`. Model output is applied only after schema and domain validation. No secrets in `NEXT_PUBLIC_*`, frontend code, logs or error messages.
- **Domain** (`live-plan-engine`): one mutation pipeline for chat and UI; stable IDs; AI ops never change locked items or user requirements without confirmation; integer money; append-only revisions.
- **Data honesty**: mock data is labelled DEMO; estimates are never shown as verified prices; AI assessments are never "verified". No scraping of Tori, Vinted, Facebook Marketplace or any other restricted source, and no unofficial MCP servers or internal APIs for them: products come only from official APIs, permitted feeds, licensed providers or the user's own input.
- **Accessibility** (`accessibility-wcag`): WCAG 2.2 AA for every screen and state.
- **Privacy** (`privacy-compliance-eu`): EU-first; update `docs/privacy/data-inventory.md` whenever data, logs or vendors change.
- **Dependencies**: every new dependency needs a stated reason; prefer the platform and existing packages. Do not weaken the supply-chain settings in `pnpm-workspace.yaml` without an ADR.

## Database workflow

Drizzle schema in `apps/backend/src/db/schema/` → `pnpm db:generate` writes SQL into `supabase/migrations/` → review it (RLS and policies in the same migration) → apply locally with the Supabase CLI. This replaces the "Making and Committing Schema Changes" section of the vendored `supabase` skill. The Supabase MCP server in `.mcp.json` points at the dev project in read-only mode; never connect it to production data.

## How to work

- Use plan mode for anything non-trivial. Work in small, reviewable steps and keep the app runnable.
- Record decisions in `docs/adr/` using `docs/adr/0000-template.md`.
- Before finishing a task run `pnpm check`, plus `pnpm build` when config or dependencies changed.
- Delegate reviews: `security-reviewer` (auth, data, AI, dependencies, CI), `architecture-reviewer` (domain, schema, structure), `a11y-auditor` and `ux-reviewer` (UI), `test-engineer` (tests).
- End every phase with `/phase-gate <n>`. Do not start the next phase on a BLOCK verdict.

## Conventions

- Code, identifiers, comments, commits and developer docs in English. UI copy is Finnish by default and moves to next-intl message files.
- Zod schemas are the source of truth; infer TypeScript types from them. API shapes live in `@app/contracts`.
- Environment variables are validated with Zod at startup (`apps/backend/src/env.ts`).
- Money is integer minor units plus an ISO 4217 currency code (`@app/domain` `MoneySchema`), formatted with `formatMoney`.
- Backend modules use ESM with `.js` extensions in relative imports (NodeNext).
