---
name: ux-ui-guidelines
description: UX and UI principles, layout, component patterns and review checklist for the AI planning app - chat plus live plan layout, zero-friction start, progressive follow-up questions, change summaries and undo, locks and confirmations, trust and provenance signals, empty, loading, error and conflict states, mobile tabs, Finnish and English microcopy, and human-AI interaction guidelines. Use when designing, building or reviewing screens, flows, components, states or copy.
---

# UX and UI guidelines

**North star: "AI keskustelee. Suunnitelma muuttuu. Käyttäjä säilyttää hallinnan."** The plan panel is the primary surface; the chat is how you change it.

## Flow principles
1. **Zero-friction start.** One large input, an image attachment button, 3-4 example chips, no category picker, no sign-up wall (anonymous session first; ask to save later).
2. **Value in seconds.** Show the plan skeleton as soon as the first structured response arrives. Show the AI's assumptions as editable chips ("Oletettu koko: M").
3. **Ask less, ask better.** At most three questions at a time, ordered by their impact on the plan. Every non-critical question can be skipped. Never ask again what is already answered. Say why a question matters ("vaikuttaa budjetin jakoon").
4. **Every change is visible.** Each AI turn that changes the plan shows a change summary card: added, changed, removed, budget delta. Changed cards are highlighted. Safe changes apply immediately with Undo; consequential changes ask first (see `live-plan-engine`).
5. **The user stays in control.** Locks, per-item preferences, revision history and undo are always one step away. When a request conflicts with a lock, the AI explains and offers options instead of overriding.
6. **Honest data.** Price status badges (Vahvistettu / Arvio / Demo), source and "tarkistettu" time on every price, validation state with icon and text, and plain statements of uncertainty ("Kuvasta ei voi varmistaa mallia").
7. **Graceful failure.** If the AI fails, the plan stays unchanged, the message says what happened, and Retry is offered. Handle offline, timeout, rate limit (say when to try again) and stale-plan conflicts ("Suunnitelma muuttui toisessa ikkunassa - päivitä").

## Layout
- **Desktop (1024 px and wider):** chat on the left (about 40 %), plan on the right (about 60 %), plan header with a sticky budget bar.
- **Tablet:** plan first, chat in a resizable side sheet.
- **Mobile:** tabs "Keskustelu | Suunnitelma" with a change badge; the budget summary stays visible on the plan tab; the chat input never covers focused content.

## Components (shadcn/ui based, in `apps/frontend/src/components/plan/` and `apps/frontend/src/components/chat/`)
`PlanHeader`, `BudgetBar`, `ComponentCard` (states: planned, candidate selected, purchased, locked, conflict), `PriceBadge`, `ValidationBadge`, `ProvenanceInfo`, `ChangeSummaryCard`, `QuestionWidget` (one per question type), `AssumptionChip`, `RevisionTimeline`, `ManualProductForm`, `EmptyState`, `ErrorState`. Build every component with all of its states before wiring real data.

## States every screen needs
empty, loading or streaming, partial (plan exists, questions open), success, error, conflict (stale version), rate-limited, offline, anonymous versus signed-in.

## Microcopy
- Plain language and active voice; Finnish by default, English through i18n. No "AI magic" claims - say what the AI did and why.
- Format numbers and money with `Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' })`, which gives "1 234,50 €".
- The assistant is labelled as AI (EU AI Act transparency).
- Mock data says so: "Demo-tuote - ei oikea tarjous".

## Human-AI interaction checklist (after Microsoft's Guidelines for Human-AI Interaction)
- Make clear what the planner can and cannot do, and how reliable it is.
- Show contextually relevant information and time interruptions well.
- Support efficient invocation, dismissal and correction: editable assumption chips, undo, locks.
- Scope the service when in doubt: ask instead of guessing on consequential changes.
- Explain why the system acted ("Vaihdoin takin, koska budjetti ylittyi 40 €").
- Remember recent interactions and never re-ask.
- Adapt cautiously, tell the user about changes, and provide global controls (preferences, data deletion).

## Visual direction
Calm, trustworthy and content-first: neutral surfaces, one accent colour, clear typographic hierarchy, generous spacing, product images at consistent ratios, and motion only to explain change (200 ms or less, respecting reduced motion). Use design tokens (CSS variables) for colour, radius and spacing, with light and dark themes from day one.

## UX review checklist
- [ ] The golden path works end to end on desktop and mobile.
- [ ] Every AI change has a visible summary and an undo.
- [ ] Mock and estimated data are labelled everywhere they appear.
- [ ] Every state listed above is designed and reachable.
- [ ] The mobile tab badge appears when the plan changes off-screen.
- [ ] Copy is reviewed in Finnish and English.
- [ ] The `accessibility-wcag` checks pass.
