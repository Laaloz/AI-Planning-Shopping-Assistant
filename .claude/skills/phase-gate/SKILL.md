---
name: phase-gate
description: Runs the quality gate at the end of a phase or before a merge - lint, type check, unit, database-isolation and end-to-end tests, then the relevant review agents in parallel - and writes one gate report with a PASS or BLOCK verdict. Run it manually with /phase-gate.
disable-model-invocation: true
argument-hint: "[phase number or 'diff']"
---

# Phase gate

Goal: one honest verdict on whether the work can move on. Do not fix anything during the gate - report.

## 1. Scope
- Changed files: `git diff --name-only $(git merge-base HEAD origin/main)` plus uncommitted changes from `git status --porcelain`. If there is no `origin/main`, ask which base to use.
- If `$ARGUMENTS` is a phase number, read that phase's exit criteria from `docs/implementation-plan.md`.

## 2. Automated checks
Run each one and record pass or fail with the key output lines. An infrastructure failure is reported, never silently skipped.
1. `pnpm format:check`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm build`
6. `pnpm test:db` - once it exists (added in Phase 0); needs local Supabase (`supabase start`). If it is not running, mark the check NOT RUN.
7. `pnpm test:e2e` - once it exists (added in Phase 0), when any UI or API route changed.

## 3. Reviews
Launch the relevant agents in parallel, giving each the changed files, the phase goal and the exit criteria:

| Changed paths | Agent |
|---|---|
| `apps/backend/**`, `packages/contracts/**`, `supabase/**`, `apps/frontend/src/proxy.ts`, `apps/frontend/next.config.ts`, `vercel.json` files, env files, `package.json` files, `pnpm-workspace.yaml`, the lockfile, `.github/**`, `.claude/settings.json`, `.mcp.json` | `security-reviewer` |
| `packages/domain/**`, `packages/contracts/**`, `apps/backend/src/plan/**`, `apps/backend/src/db/**`, `apps/backend/src/ai/schemas/**`, `supabase/migrations/**`, new top-level folders or packages | `architecture-reviewer` |
| `apps/frontend/src/app/**`, `apps/frontend/src/components/**`, styles, message files | `a11y-auditor` and `ux-reviewer` |
| source changes without matching tests | `test-engineer` (gap report only - no test writing during the gate) |

## 4. Gate report
Write `docs/gates/<YYYY-MM-DD>-phase-<n>.md` containing:
- A summary table of checks and results.
- Findings grouped Critical, High, Medium, Low, each with file:line, the problem, why it matters, the suggested fix and the agent that found it.
- Exit criteria, each marked met or not met, with evidence.
- Verdict: **BLOCK** if any check failed or did not run, any Critical or High finding exists, or an exit criterion is unmet; otherwise **PASS**, with Medium and Low items listed as follow-ups.

Show the verdict and the top findings in the chat and link the report file.
