---
name: accessibility-wcag
description: Accessibility requirements and patterns for this app - WCAG 2.2 level AA (EN 301 549, European Accessibility Act), semantic HTML with shadcn/ui and Radix, AI chat and streaming announcements, plan-change announcements, dynamic question widgets, plan cards, budget inputs, mobile tabs, dialogs, forms, accessible authentication, images, motion, language, and automated plus manual testing. Use when building or reviewing any UI, component, page, form, interaction, copy, colour or theme, or end-to-end test.
---

# Accessibility (WCAG 2.2 AA)

Target: WCAG 2.2 level AA for every screen and every state. Accessibility failures are bugs, not polish.

## Baseline
- Semantic HTML first, ARIA only to fill gaps. Landmarks: `header`, `nav`, `main`, and the plan panel as a labelled region. One `h1` per page and a logical heading order.
- Everything works with the keyboard alone, in a sensible order, with a clearly visible focus indicator that is never hidden behind sticky headers, the chat input or bottom bars (2.4.7, 2.4.11).
- Pointer targets at least 24 x 24 CSS px (2.5.8). Anything draggable has a button alternative (2.5.7).
- Contrast: text 4.5:1 (large text 3:1); UI components and meaningful graphics 3:1 (1.4.3, 1.4.11). Never colour alone (1.4.1): statuses use an icon **and** text.
- Reflow at 320 CSS px width and 400 % zoom without two-dimensional scrolling (1.4.10); respect text-spacing overrides (1.4.12).
- `prefers-reduced-motion` turns off non-essential animation; nothing flashes.
- `<html lang>` matches the UI locale (`fi` or `en`); inline passages in another language get their own `lang`.
- Help and contact links are in the same place on every page (3.2.6).

## Forms and authentication
- Visible labels. Group related controls with `fieldset` and `legend`. Errors are text, linked with `aria-describedby`; on submit, focus moves to the first error.
- Never ask for the same information twice in a flow (3.3.7). This is also a product rule: never re-ask an answered question.
- Accessible authentication (3.3.8): email OTP or magic link, passkeys, or passwords with paste and password managers allowed. No image or puzzle CAPTCHA; Turnstile in managed, mostly non-interactive mode is acceptable.

## AI chat
- Messages form a list; each message has an accessible author label ("Sinä", "Avustaja"). The assistant is clearly identified as AI.
- **Never stream tokens into a live region.** While a reply is generating, set `aria-busy="true"` on the message; when it completes, announce one short status in a single polite live region, for example "Vastaus valmis. Suunnitelmaan tehtiin 2 muutosta."
- Stop, retry and copy are real buttons with accessible names. Errors are announced once.
- Rendered Markdown keeps its semantics (headings, lists). Link text is meaningful out of context.

## Plan changes
- After a change, announce a summary in the polite live region, and mark changed cards with a visual highlight plus visible text ("Muutettu"), not colour only.
- Never move focus automatically while the user is typing in the chat. Offer a "Näytä muutokset" button that moves focus to the change summary.
- Undo is keyboard reachable and does not disappear after a few seconds: keep it in the change summary, not only in a toast.

## Dynamic question widgets
| Type | Pattern |
|---|---|
| Single choice | radio group inside `fieldset` + `legend` |
| Multiple choice | checkbox group inside `fieldset` + `legend` |
| Yes/no | two radios, or two toggle buttons with `aria-pressed` |
| Budget, numeric | number input with a visible label and unit; a slider is optional and always paired with the text input |
| Free text, model number | text input with label, hint and example |
| Image | file input with a visible label; accepted formats and maximum size stated in text |

Non-critical questions have a skip button ("Ohita"). After an answer, focus moves to the next question or to the confirmation, which is announced.

## Plan cards and dialogs
- Cards are list items with a heading (the component name). Badges contain text: "Arvio", "Vahvistettu hinta", "Demo-data", "Ristiriita".
- Action buttons include the item in their accessible name ("Lukitse: Takki"); the lock toggle uses `aria-pressed`.
- Consequential actions open an accessible dialog: focus is trapped, Esc closes it, focus returns to the trigger.
- Prices are formatted for the locale; the accessible text says whether a price is an estimate.

## Mobile tabs
Radix Tabs (`role="tablist"`). The change badge is part of the tab's accessible name ("Suunnitelma, 2 uutta muutosta").

## Images
User images need alt text: the AI may suggest it and the user can edit it. Decorative images use `alt=""`.

## Testing - part of the Definition of Done for UI work
- `eslint-plugin-jsx-a11y` runs in `pnpm lint`.
- `@axe-core/playwright` scans in e2e tests tagged `@a11y`, for every key screen and state (start, questions, plan, change summary, open dialog, mobile tabs), with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`. Zero violations.
- A keyboard-only run of the golden path in every phase.
- A screen-reader smoke test in every phase: NVDA with Firefox or Chrome on Windows, VoiceOver on macOS and iOS, TalkBack on Android.
- Automated tools catch only part of the problems; manual checks are mandatory.

## Legal context (EU / Finland)
The European Accessibility Act has applied to consumer e-commerce services since 28 June 2025, with EN 301 549 and WCAG as the technical reference. Microenterprises providing services are exempt, but build to AA anyway: selling a paid plan online is likely an e-commerce flow, retail and B2B partners will require it, and retrofitting costs far more. Publish accessibility information for the service.
