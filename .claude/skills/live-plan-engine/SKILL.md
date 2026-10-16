---
name: live-plan-engine
description: Core domain rules for the live plan - data model, stable IDs, typed patch operations, the single mutation pipeline, revisions and undo, locks, purchase-preference inheritance, provenance, price status and deterministic budget math. Use whenever you create or change plan schemas or tables, the mutation engine, AI patch proposals, validators, budget code, or any UI or chat flow that edits a plan.
---

# Live plan engine

**The live plan is the product. The conversation is not the database. The AI proposes, the backend validates and applies, the user stays in control.**

## Invariants - never break these
1. **Stable IDs.** Every plan entity (project, requirement, component, candidate, dependency, question, revision) has a UUID generated server-side, never by the model. Never key or match anything by display name. New entities inside one AI proposal use temporary IDs (`tmp:1`, `tmp:2`) that the server replaces with UUIDs.
2. **One mutation pipeline.** Chat and UI edits both go through `proposeOps -> validateOps -> applyOps (pure) -> runValidators -> classify -> persistRevision`. Nothing writes plan tables outside `apps/backend/src/plan/repository.ts`.
3. **Small change, small patch.** Never regenerate the whole plan for a local change. "Make the jacket black" yields one `update_component` op.
4. **Locks are sacred.** AI-origin ops that touch a `locked` entity, or a requirement with `source: 'user'`, are rejected or turned into a confirmation request. Only a user-origin op can unlock.
5. **Requirements never disappear silently.** Removing or weakening a requirement is an explicit op with a `reason` and always needs user confirmation.
6. **Provenance on every fact.** `source: 'user' | 'ai_inferred' | 'catalog' | 'manual_entry' | 'mock'`, plus `sourceUrl?`, `observedAt?` and `confidence?` (0-1) where relevant. AI assumptions are stored as assumptions, separate from prices and source data.
7. **Price honesty.** `priceStatus: 'verified' | 'estimated' | 'mock'`. Only catalog or feed data with `observedAt` can be `verified`. Mock data is always labelled DEMO and never counted in verified totals.
8. **Validation honesty.** Each `ValidationResult` has `state: 'verified' | 'needs_verification' | 'conflict' | 'unknown'` and `basis: 'deterministic' | 'ai_assessment' | 'user_provided' | 'missing_data'`. A result with `basis: 'ai_assessment'` can never have `state: 'verified'`.
9. **Money is integers.** Minor units (cents) as integers plus an ISO 4217 currency code. Budgets and totals are computed by deterministic code, never by the model.
10. **Append-only history.** Every accepted change writes a revision: `ops`, `inverseOps`, `reason`, `origin: 'user' | 'ai'`, `actorId`, `baseVersion`, `createdAt`. Undo applies `inverseOps` as a new revision; history is never rewritten.
11. **Optimistic concurrency.** `plans.version` increments on every revision. Ops carry `baseVersion`; a stale proposal is rejected and re-proposed against the fresh plan.

## Patch operations
A Zod discriminated union on `op`, defined once in `packages/domain/src/plan/ops.ts` and reused by the AI output schema and the API contracts.

| op | Purpose |
|---|---|
| `add_component` / `remove_component` | add or remove a slot in the plan |
| `update_component` | set specific fields (name, attributes, quantity, notes) |
| `replace_component` | swap the product or candidate in a slot, keeping the slot ID |
| `set_lock` | lock or unlock (unlock: user origin only) |
| `set_purchase_preference` | project default or component override |
| `add_requirement` / `update_requirement` / `remove_requirement` | requirements and constraints (remove always confirms) |
| `set_budget` | maximum budget and currency |
| `add_dependency` / `remove_dependency` | edges between components |
| `add_candidate` / `select_candidate` | product alternatives for a component |
| `mark_purchased` | record a purchase (price actually paid, date) |
| `answer_question` | store a follow-up answer and the requirement derived from it |

Every op is `{ op, targetId?, payload, reason }`. Ops proposed by the model must reference IDs that exist in the plan snapshot it was given; an unknown ID rejects the whole proposal.

## Classification - what applies automatically
- **Apply now, show Undo:** single-field edits the user explicitly asked for, adding candidates, preference changes the user requested, answers to questions.
- **Ask first:** touches anything locked or `source: 'user'`; removes components or requirements; pushes the plan over budget; changes more than 3 components; reverses `mark_purchased`; low model confidence or ambiguous intent (for "make it cheaper" with several valid strategies, offer options).

## Purchase preferences
Project default `new | used | new_or_used` plus filters (maximum price, condition, area, shipping or pickup, marketplaces). Effective preference = component override ?? project default; filters merge field by field with the override winning. Persist preferences and pass the effective preference into every recommendation prompt.

## Where the code lives
- `packages/domain/src/plan/` - pure TypeScript, no I/O, shared by both apps: `schema.ts`, `ops.ts`, `apply.ts`, `inverse.ts`, `classify.ts`, `budget.ts`, `preferences.ts`, `validators/` (generic rules plus per-category folders such as `validators/pc/`). Money helpers are in `packages/domain/src/money.ts`. ESLint blocks I/O, framework imports, `Date.now()` and `Math.random()` there.
- `apps/backend/src/plan/` - service (runs the pipeline), repository (transactions through `withRls`), revision persistence. Routes in `apps/backend/src/routes/` only parse input and call the service.
- `apps/backend/src/ai/` - prompts, structured-output schemas, read-only tools.
- `packages/contracts/src/` - request and response schemas for the plan API.
- `apps/frontend` renders the plan and sends user edits as ops to the backend; it never applies ops to stored data itself.

Category-specific attributes live in a validated JSONB `attributes` column with a Zod schema per category, not in new columns per category.

## Required tests (Vitest; property tests with fast-check)
- Applying `inverseOps` after `ops` returns the original plan.
- No AI-origin op sequence can change a locked entity or a user requirement.
- Budget totals equal the sum of selected prices in integer cents; mock and estimated prices never count as verified.
- Preference inheritance matrix: project default x component override x filters.
- A stale `baseVersion` is rejected.
