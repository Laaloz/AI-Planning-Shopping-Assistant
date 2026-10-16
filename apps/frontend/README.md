# @app/frontend

Next.js 16 web app (App Router). It renders the conversation and the live plan and never talks to
the database directly: every data request goes to the backend through the same-origin `/api/*`
rewrite configured in `next.config.ts`.

See the [root README](../../README.md) for setup and commands.
