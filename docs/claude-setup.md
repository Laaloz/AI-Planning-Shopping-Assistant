# Claude Code setup

This repository ships its own Claude Code configuration so that every session builds the app the same way: securely, accessibly and within the architecture in `CLAUDE.md`.

## Contents

| Path                                                                         | What                                                                                               | When it is used                                 |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `CLAUDE.md`, `apps/frontend/CLAUDE.md`                                       | product, layout, commands, non-negotiables, way of working                                         | every session                                   |
| `.claude/skills/live-plan-engine`                                            | plan data model, patch operations, revisions, locks, budget                                        | plan-related code                               |
| `.claude/skills/app-security-baseline`                                       | authentication, authorization (RLS and backend checks), API routes, storage, secrets, supply chain | auth, database, API, dependencies               |
| `.claude/skills/ai-llm-rag-security`                                         | OWASP Top 10 for LLM Applications 2025, prompt injection, tools, RAG, evals                        | prompts, AI schemas, retrieval                  |
| `.claude/skills/accessibility-wcag`                                          | WCAG 2.2 AA, chat and plan accessibility patterns, testing                                         | all UI work                                     |
| `.claude/skills/ux-ui-guidelines`                                            | UX principles, states, components, microcopy, review checklist                                     | screens and flows                               |
| `.claude/skills/privacy-compliance-eu`                                       | GDPR, data residency, AI Act, consumer law, cookies                                                | data, logs, vendors, legal pages                |
| `.claude/skills/phase-gate`                                                  | `/phase-gate`, the quality gate at the end of a phase                                              | manually                                        |
| `.claude/skills/supabase`, `.claude/skills/supabase-postgres-best-practices` | Supabase's official skills, vendored (see below)                                                   | Supabase and Postgres work                      |
| `.claude/agents/security-reviewer.md`                                        | security reviewer, read-only                                                                       | after auth, data, AI, CI or dependency changes  |
| `.claude/agents/architecture-reviewer.md`                                    | architecture and domain reviewer, drafts ADRs                                                      | after schema, domain or structure changes       |
| `.claude/agents/a11y-auditor.md`                                             | accessibility auditor: code, axe, browser                                                          | after UI changes                                |
| `.claude/agents/ux-reviewer.md`                                              | UX reviewer: walks the golden path in a browser                                                    | after screens and at the end of a phase         |
| `.claude/agents/test-engineer.md`                                            | writes domain, isolation, AI-contract and end-to-end tests                                         | features and test gaps                          |
| `.claude/settings.json`                                                      | permissions (secrets blocked, risky commands ask first), security-guidance plugin                  | always                                          |
| `.claude/claude-security-guidance.md`, `.claude/security-patterns.json`      | threat model and custom checks for the security-guidance plugin                                    | always                                          |
| `.mcp.json`                                                                  | Supabase MCP server: dev project, read-only                                                        | when Claude needs the database or Supabase docs |
| `docs/adr/`                                                                  | architecture decision records                                                                      | when recording decisions                        |

## First-time setup

1. `nvm use` (Node 24), then `pnpm install` in the repository root. pnpm downloads the version pinned in `package.json` by itself.
2. Start `claude` in the repository root and accept the workspace trust prompt. Project permissions, the servers in `.mcp.json` and the agents' MCP servers take effect only after that.
3. Authenticate the Supabase MCP server: run `claude /mcp` in a regular terminal (not an IDE extension), pick `supabase` and finish the OAuth flow in the browser.
4. Check with `/plugin` that security-guidance loaded. If the marketplace is missing:
   ```
   /plugin marketplace add anthropics/claude-plugins-official
   /plugin install security-guidance@claude-plugins-official
   /reload-plugins
   ```
   The plugin needs Python; the commit-level review needs Python 3.10+.
5. Ask "What skills are available?". Nine project skills should be listed.
6. Recommended: turn on the Bash sandbox with `/sandbox` (auto-allow). Docker does not work inside the sandbox, so run `supabase start` in your own terminal.
7. If your plan includes Opus, change `model: inherit` to `model: opus` in `security-reviewer` and `architecture-reviewer`.

## Supabase MCP server

`.mcp.json` connects to the dev project `mnfnzzcccvjxnwkocoug` (eu-west-1) with `read_only=true` and the `docs`, `database`, `debugging` and `development` feature groups. Compared with the command the Supabase dashboard suggests:

- **Read-only:** SQL runs as a read-only Postgres role, so Claude cannot change data or schema by accident. Schema changes go through migrations (see the database workflow in `CLAUDE.md`).
- **No `account`, `functions` or `branching`:** account tools are unavailable in a project-scoped server anyway, the app does not use Edge Functions, and branching is a paid feature with write operations.
- **Never production.** Create a separate production project before the beta and do not connect any MCP server to it.

If you want Claude to write to the dev database, add a personal server instead of editing the shared file, for example `claude mcp add --scope local --transport http supabase-dev-write "https://mcp.supabase.com/mcp?project_ref=mnfnzzcccvjxnwkocoug"`. For local work, `supabase start` serves an MCP endpoint at `http://localhost:54321/mcp`: `claude mcp add --scope local --transport http supabase-local http://localhost:54321/mcp`.

## Vendored Supabase skills

`.claude/skills/supabase` and `.claude/skills/supabase-postgres-best-practices` are copied unchanged from [supabase/agent-skills](https://github.com/supabase/agent-skills) at commit `c9be0e931b7930f7d02126d04774d904c381e7d7` (2026-10-02), MIT licence (`LICENSE` in each folder). They are vendored rather than installed with `npx skills add` so that the version is pinned, reviewed in a pull request and identical for everyone, including cloud sessions. Prettier skips them.

To update: clone the upstream repository, review the diff of both skill folders, copy them over, and update the commit hash above in the same pull request.

The project's database workflow in `CLAUDE.md` replaces the "Making and Committing Schema Changes" section of the `supabase` skill.

## Recommended add-ons

Skills and plugins steer Claude and can run commands, so they are part of the supply chain. Read SKILL.md and any scripts before installing, and prefer known publishers.

| Add-on                                                      | Purpose                                                   | Install                                                             |
| ----------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------- |
| security-guidance (Anthropic)                               | checks Claude's changes per edit, per turn and per commit | enabled in `settings.json`                                          |
| `/security-review` (built in)                               | security review of a branch on request                    | command                                                             |
| Claude Security plugin (Anthropic)                          | deep scan of the whole repository before a release        | Claude documentation                                                |
| vercel-react-best-practices, web-design-guidelines (Vercel) | React and Next.js performance, UI audit                   | `npx skills add vercel-labs/agent-skills`, then pick only these two |
| frontend-design (Anthropic)                                 | visual direction for the UI                               | `/plugin install frontend-design@claude-plugins-official`           |
| Axe Accessibility (Deque)                                   | axe scan, fix and verify                                  | the claude.ai plugin directory                                      |

The Playwright MCP server is defined inside the `a11y-auditor` and `ux-reviewer` agents, so its tools do not load into the main conversation. The agents only visit localhost.

## Daily use

- **Build:** plan mode, small steps, then `pnpm check`.
- **Review:** "Use security-reviewer on this branch" or `@"a11y-auditor (agent)" check the start screen`.
- **End of a phase:** `/phase-gate 0` writes a report to `docs/gates/` with a PASS or BLOCK verdict.

## Using the skills on claude.ai

The six knowledge skills use only the `name` and `description` fields, so they can also be uploaded in claude.ai settings (one zip per folder), from where they sync to Claude Code sessions signed in with the same account. Keep each skill in one place, either the repository or the account, so Claude does not load two versions. `phase-gate` uses Claude Code-only fields, and the agents work only in Claude Code.
