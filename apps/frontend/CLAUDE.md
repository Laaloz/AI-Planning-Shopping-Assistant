@AGENTS.md

# Frontend notes

- This app renders UI only. It never queries the database or calls model providers. Every data
  request goes to the backend through the same-origin `/api/*` rewrite (`next.config.ts`), with the
  user's Supabase access token as `Authorization: Bearer`.
- Parse every backend response with the matching schema from `@app/contracts` before using it.
- Client code may only read `NEXT_PUBLIC_*` variables, and those must never hold secrets.
- UI copy is Finnish by default and moves to next-intl message files later in Phase 0.
- Follow the `accessibility-wcag` and `ux-ui-guidelines` skills for every screen and state.
