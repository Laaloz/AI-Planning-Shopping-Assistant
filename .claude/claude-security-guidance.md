# Security guidance for this repo (AI Planning & Shopping Assistant)

Stack: pnpm monorepo. `apps/frontend` is Next.js 16 (App Router) and renders UI only. `apps/backend` is a Hono API on Vercel Functions and is the only component that touches Supabase Postgres (RLS), Storage writes and model providers. `packages/domain` is pure plan logic; `packages/contracts` holds the Zod API schemas. Drizzle ORM, Vercel AI SDK, Zod.

Threat model: multi-user consumer app. Each user's projects, plans, messages, uploads and revisions are private to that user, except through explicit share links. Attackers: other signed-in users (IDOR, cross-tenant reads), anonymous visitors (abuse, cost exhaustion), and untrusted content passed to the LLM (product descriptions, feed rows, page text, text inside images) attempting prompt injection.

Review checklist:
- Every backend route parses input with a strict Zod schema from @app/contracts, sits behind requireUser (all of /v1), and checks ownership of the target resource in the service layer; another user's resource answers 404. userId, ownerId, prices and priceStatus never come from the client.
- Backend auth verifies the Bearer token with supabase.auth.getClaims(token), never getSession(). The frontend's proxy.ts only refreshes sessions; it is not the authorization check. No Next.js Server Actions or route handlers read or write app data.
- User-scoped database access goes through withRls(), which sets request.jwt.claims with a bound parameter and `set local role authenticated` inside one transaction. adminDb (bypasses RLS) is used only in migrations, seeds and apps/backend/src/jobs/**. No sql.raw with user data.
- Every new table in an exposed schema enables RLS in the same migration, with per-operation policies using (select auth.uid()) and WITH CHECK on insert/update, plus indexes on policy columns.
- CORS uses the ALLOWED_ORIGINS allowlist, never `*`. Error responses use the shared envelope and never include stack traces, SQL or provider messages.
- Storage: private bucket, objects under <user_id>/..., size/MIME/magic-byte validation, re-encoding with EXIF removed, short-lived signed URLs.
- LLM output never mutates state directly: it is a Zod-validated patch proposal applied by the domain engine. AI tools are read-only and scoped to the current user's project. Untrusted content is passed as delimited data, never in system prompts.
- Model-generated Markdown is rendered without raw HTML; links limited to https/mailto; no dangerouslySetInnerHTML with model or feed content.
- No secrets in NEXT_PUBLIC_* variables, frontend code, logs or error messages; no tokens, message content or emails in logs.
- Outbound fetches only to allowlisted hosts: https only, private/loopback/link-local addresses blocked, no cross-host redirects, timeouts and size caps.
- AI endpoints have per-user and per-IP rate limits and a daily token budget; anonymous users get stricter limits.
- Share links use random tokens stored hashed, are revocable and expiring, and expose no owner PII.
- Dependencies: new packages need a reason; pnpm-workspace.yaml keeps minimumReleaseAge, trustPolicy, blockExoticSubdeps and strictDepBuilds; GitHub Actions stay pinned to commit SHAs with read-only default permissions.
