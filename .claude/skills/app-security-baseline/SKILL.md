---
name: app-security-baseline
description: Security baseline for this app (Next.js 16 frontend, Hono backend, Supabase) - authentication (Supabase Auth with getClaims, anonymous sign-in, email OTP and Google), authorization and per-user isolation (Row Level Security, RLS-scoped Drizzle transactions, ownership checks in the backend), API routes and middleware, storage uploads, secrets, rate limiting, security headers, share links and dependency supply chain. Use when writing or reviewing auth, sessions, API routes, schema, migrations, RLS policies, storage, environment variables, headers or dependencies.
---

# App security baseline

Assume every request is hostile and anything sent to the browser can be read by the user. Only the backend (`apps/backend`) touches the database, storage writes and model providers. Authorization is enforced **twice**: in Postgres (RLS) and in backend code.

## 1. Authentication (Supabase Auth)
- The frontend uses `@supabase/ssr` only to sign users in and refresh the session cookie (`proxy.ts`). It calls the backend with `Authorization: Bearer <access token>`. Frontend server code forwards the user's token and never holds a secret key.
- The backend verifies every token with `supabase.auth.getClaims(token)` in `requireUser` (`apps/backend/src/auth/`). **Never** trust `getSession()` on a server. Use `getUser()` only when a fresh user record is needed.
- `proxy.ts` is not an authorization check. It refreshes sessions and redirects coarsely.
- Sign-in: email OTP and Google OAuth. Exact-match redirect URL allowlist. Configure custom SMTP before launch; the built-in mailer is for development.
- Anonymous sign-in lets people try the planner without an account. Protect it with Cloudflare Turnstile and stricter limits; gate sharing, larger uploads and expensive operations on `isAnonymous === false` (`is_anonymous` in the JWT and in RLS). Upgrade to a permanent account by linking an identity, so data is kept.
- Personalised responses are never cached: the backend sends `Cache-Control: no-store` on `/v1/*`.

## 2. Authorization layer 1 - Postgres RLS
- Enable RLS in the **same migration** that creates a table in an exposed schema. No table ships without policies.
- One policy per operation, `to authenticated`, using `(select auth.uid())` for the per-statement initPlan optimisation, and `with check` on insert and update:

```sql
alter table public.projects enable row level security;

create policy "projects_select_own" on public.projects
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "projects_insert_own" on public.projects
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "projects_update_own" on public.projects
  for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "projects_delete_own" on public.projects
  for delete to authenticated using ((select auth.uid()) = owner_id);

create index on public.projects (owner_id);
```

- Child tables carry a denormalised `owner_id` (preferred: simple and fast policies) or check the parent with `exists (...)`. Index every column used in a policy.
- Avoid `security definer` functions. If one is unavoidable: `set search_path = ''`, fully qualified names, a non-exposed schema, and an explicit `auth.uid()` check inside.
- Run the Supabase security and performance advisors after every migration; they must be clean before merge.

## 3. Authorization layer 2 - backend code
- Routes (`apps/backend/src/routes/`) stay thin: parse input, read `c.get("user")`, call a service, return a DTO.
- Services and repositories check ownership of every resource they touch and return only what the client needs - never raw rows, other users' data or internal flags.
- **Drizzle bypasses RLS by default.** The `postgres` connection role has BYPASSRLS. User-scoped queries run inside `withRls(user, async (tx) => ...)` (`apps/backend/src/db/rls.ts`), which in one transaction calls `set_config('request.jwt.claims', $1, true)` with a **bound parameter** and `set local role authenticated`. Never build these statements with string interpolation or `sql.raw`, and never use session-level `set` on a pooled connection.
- `adminDb` (bypasses RLS, `apps/backend/src/db/admin.ts`) is imported only by migrations, seeds and `apps/backend/src/jobs/**` - never by code that serves a user request.
- The Supabase secret key is backend-only: never in the frontend, never `NEXT_PUBLIC_*`, never logged.

## 4. API routes and middleware (Hono)
Global middleware lives in `apps/backend/src/create-app.ts`: request id, secure headers, CORS allowlist from `ALLOWED_ORIGINS` (never `*`), body size limit, the JSON error envelope from `@app/contracts`, and a generic 500 that never leaks internals.

Every route:
1. Parses params, query and body with a strict Zod schema from `@app/contracts` (`.strict()`, length and size limits) and answers 400 on failure.
2. Requires a user: everything under `/v1` sits behind `requireUser`. Anonymous-allowed routes also apply the anonymous limits.
3. Authorizes the specific resource in the service layer. Another user's resource answers 404, not 403.
4. Returns a minimal DTO or a typed error. Server logs get details without tokens, request bodies or PII.

Also:
- Never accept `userId`, `ownerId`, prices or `priceStatus` from the client.
- The browser reaches the backend through the frontend's same-origin `/api/*` rewrite. Do not add Next.js Server Actions or route handlers that read or write app data; one that is ever needed is a public endpoint and follows the four steps above.
- The backend authenticates with Bearer tokens only, so cross-site requests cannot ride on cookies. Do not add cookie authentication to the backend without a CSRF design.

## 5. Storage and uploads
- Private bucket. Object path `${userId}/${projectId}/${uuid}.webp`. Storage policies restrict access to `(storage.foldername(name))[1] = (select auth.uid())::text`.
- The backend validates size (default maximum 10 MB), MIME allowlist (jpeg, png, webp, heic), magic bytes and pixel dimensions, then re-encodes with `sharp` to WebP. Re-encoding strips EXIF/GPS and neutralises polyglot files. Store only the re-encoded file.
- Serve through short-lived signed URLs. Never make the bucket public.

## 6. Abuse and cost controls
- Rate limit every AI endpoint per user and per IP (sliding window), plus a daily token or cost budget per user stored in Postgres. Anonymous users get stricter limits. Return 429 with `Retry-After`.
- Cap message length, images per message, and the conversation history sent to the model.

## 7. Headers
- Frontend: nonce-based CSP from `proxy.ts` (`script-src 'self' 'nonce-...' 'strict-dynamic'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`); `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options` and `Permissions-Policy` from `next.config.ts`. Vercel adds HSTS.
- Backend: Hono `secureHeaders()`, plus `Cache-Control: no-store` for user data.

## 8. Secrets and environments
- Real values live in gitignored `apps/*/.env*` files; each `.env.example` lists names only. The backend validates its environment with Zod at startup (`apps/backend/src/env.ts`) and fails fast. Frontend client variables are `NEXT_PUBLIC_*` and hold no secrets.
- Separate Supabase projects for dev and prod. AI tools and MCP servers connect only to local or dev, read-only where possible.
- Turn on GitHub secret scanning with push protection. Rotate any key that ever reached git history.

## 9. Share links (later phase)
Random 128-bit tokens stored hashed, read-only view, revocable and expiring, `noindex`, and no owner PII in the shared view.

## 10. Dependencies and supply chain
- pnpm 12 pinned in `packageManager` (ADR-0003), with a committed lockfile. Keep `minimumReleaseAge`, `trustPolicy: no-downgrade`, `blockExoticSubdeps` and `strictDepBuilds` in `pnpm-workspace.yaml`; allow install scripts only for vetted packages via `allowBuilds`. Exceptions in `minimumReleaseAgeExclude` name exact versions, say why, and are removed once the version has aged.
- Adding a dependency is a decision: check maintenance, adoption and provenance, and whether 20 lines of our own code would do.
- Apply Next.js, React and Hono security releases within 48 hours. React2Shell (CVE-2025-55182) was an unauthenticated CVSS 10 RCE in React Server Components.
- Dependabot with a cooldown at least as long as `minimumReleaseAge`. GitHub Actions are pinned to commit SHAs.

## Tests that must exist
- **Auth:** missing, malformed, expired and wrong-role tokens get 401; the verifier is never called for malformed headers (`apps/backend/src/create-app.test.ts`).
- **Isolation, database level:** with two users, B cannot select, insert, update or delete A's projects, components, messages, revisions or storage objects. Runs against local Supabase.
- **Isolation, API level:** every `/v1` route called with another user's IDs answers 404.
- **Anonymous limits:** an anonymous user cannot share, and exceeding limits returns 429.
- **RLS coverage:** a test fails if any table in `public` has RLS disabled.
