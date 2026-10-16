# ADR-0002: Own accounts with Supabase Auth; the app pays for model usage

- Status: Accepted
- Date: 2026-10-16
- Deciders: @Laaloz

## Context

The owner asked whether users should sign in with their ChatGPT or Claude account, so that model usage would be billed to their own subscription. Findings in October 2026:

- **Sign in with ChatGPT** is identity sign-in. Using the user's plan for AI requests is an optional add-on for Go, Plus and Pro users; it counts against their plan usage, users can cap each app weekly, and commercial apps get it only as partners through an interest form. The help article does not mention model choice or regional data handling. ([OpenAI Help Center](https://help.openai.com/en/articles/20001542-using-your-chatgpt-plan-in-other-apps-and-sites))
- **Claude subscriptions:** Anthropic's documentation (updated 2026-02-19) says OAuth tokens from Claude Free, Pro or Max accounts may not be used in any other product, tool or service; third-party developers use API keys. ([WinBuzzer](https://winbuzzer.com/2026/02/19/anthropic-bans-claude-subscription-oauth-in-third-party-apps-xcxwbn/))
- **MCP Apps** became the first official MCP extension on 2026-01-26 and render interactive UIs inside Claude and ChatGPT. An app exposed this way runs inside the user's own Claude or ChatGPT subscription, legitimately. ([MCP blog](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/))
- Product requirements: a zero-friction start, EU data residency before the beta, model choice in our hands, and per-user isolation with RLS.

## Decision

- **Accounts:** Supabase Auth with an anonymous start (upgraded later by linking an identity, so data is kept), email OTP and Google. The backend verifies every access token with `getClaims()`.
- **Model usage:** a server-side API key that never reaches the browser, with Claude on an EU-resident endpoint before the beta. Per-user and per-IP rate limits and daily budgets, stricter for anonymous users; freemium limits later.
- **Later option:** expose the backend as an MCP App, ChatGPT app or Claude connector (OAuth 2.0), so users can work on their plans inside ChatGPT or Claude on their own subscription. The separate backend (ADR-0001) is the base for this.
- **Bring your own key:** at most an optional advanced feature later, with keys encrypted at rest.

## Alternatives considered

- **Sign in with ChatGPT with plan usage:** partner-only for commercial apps, paid plans only, weekly caps set by the user, OpenAI models only, and no documented control over data residency.
- **Claude account sign-in:** not permitted for third-party products.
- **Bring your own key by default:** breaks the zero-friction start and makes us handle users' secrets.

## Consequences

- The app pays for model usage, so rate limits, budgets and cost monitoring are part of Phase 1.
- The model provider can be swapped through the Vercel AI SDK without touching auth.
- Revisit if OpenAI or Anthropic open delegated plan usage to all developers with EU data residency.
