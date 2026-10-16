---
name: privacy-compliance-eu
description: Privacy and compliance guardrails for an EU/Finland consumer AI app - GDPR data minimisation, retention and data-subject rights, image and EXIF handling, LLM and other processors, data residency choices, cookies and analytics consent, EU AI Act transparency, affiliate and advertising disclosure, and price and ranking transparency for product recommendations. Use when adding data fields, logging, analytics, third-party services, uploads, sharing, affiliate links, legal pages or consent UI.
---

# Privacy and compliance (EU / Finland)

This is engineering guidance, not legal advice. When a choice has legal weight, flag it for a human decision and record it in `docs/privacy/decisions.md`.

## Data inventory first
Keep `docs/privacy/data-inventory.md` current: each data category, purpose, legal basis, retention, storage location and which processors see it. Update it in the same change that adds a field, table, log or vendor.

## Minimise
- Collect only what the plan needs. No date of birth or address unless a later feature truly requires it.
- Uploaded images: re-encode and strip EXIF/GPS before storing them and before sending them to a model; discard the original upload.
- Logs: no message content, image URLs or email addresses. IP addresses are personal data - keep them briefly (for example 30 days) and only for abuse prevention.

## Retention (defaults; confirm with the product owner)
- Anonymous accounts and their data: delete after 30 days of inactivity.
- Projects, messages and images: kept until the user deletes them or the account; deletion also removes storage objects.
- AI request metadata: 90 days.

## Data-subject rights
Before public launch: data export (JSON of projects, plans, messages and revisions) and account deletion that cascades to storage objects. Both are backend endpoints behind re-authentication.

## Processors and data residency
- Expected processors: Vercel (hosting), Supabase (database, auth, storage), the LLM provider, the rate-limit store, the email sender and error tracking.
- Choose EU regions where offered (Supabase project region, Vercel function region). Record the transfer mechanism for US-based providers.
- LLM: commercial API terms without training on inputs. Check the provider's current regional options; in 2026 the documented EU-residency route for Claude is Amazon Bedrock or Google Vertex AI EU regions. Keep the provider behind the AI SDK abstraction so switching is configuration, not a rewrite.

## Cookies and analytics
Strictly necessary cookies (the auth session) need no consent. Analytics and marketing cookies need prior consent; prefer cookieless, EU-hosted, privacy-friendly analytics, and describe it in the privacy notice either way.

## EU AI Act transparency (Article 50, applies from 2 August 2026)
- Tell users they are interacting with an AI system: label the assistant and show a first-run notice.
- If the product ever generates synthetic images, mark them as AI-generated.
- Keep an internal record of which models are used and for what.

## Consumer and marketing rules for product recommendations
- Disclose affiliate and paid relationships next to the link ("Kaupallinen yhteistyö / affiliate-linkki"), not only in the footer.
- If results are ranked, explain the main ranking parameters in plain language and disclose any paid placement.
- Show prices as the consumer pays them (VAT included), with shipping stated or marked unknown, and the time the price was checked.
- Never present demo data or estimates as offers.

## Legal pages before public launch
Privacy notice (tietosuojaseloste), terms of service, accessibility information, AI-use notice and affiliate disclosure policy.
