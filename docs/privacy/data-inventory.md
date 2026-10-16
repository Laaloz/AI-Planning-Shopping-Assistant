# Data inventory

Status: skeleton, 2026-10-16. Update this file whenever data fields, logs or vendors change (see the `privacy-compliance-eu` skill).

## Processors and regions

| Vendor                  | Purpose                                       | Region                                            | Personal data                                                       | Status              |
| ----------------------- | --------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------- | ------------------- |
| Supabase                | database, authentication, file storage        | eu-west-1 (Ireland)                               | account (email, auth identities), projects, plans, messages, images | dev project created |
| Vercel                  | hosting of the frontend and backend functions | functions in `dub1` (Dublin); edge network global | request metadata in logs                                            | not deployed yet    |
| Model provider (Claude) | needs analysis and plan changes               | EU-resident endpoint before the public beta       | message content sent with each AI request                           | Phase 1             |
| GitHub                  | source code and CI                            | US                                                | none (no production data in the repository or CI)                   | in use              |

## Data the app stores today

None. The backend has no tables yet; `GET /v1/me` only reads the user id and anonymous flag from the verified access token.

## Logs

- Backend errors are logged as JSON with request id, method, path and error name, message and stack. Tokens, request bodies and personal data are never logged.

## Open items

- Retention periods per data type (anonymous accounts 30 days, AI request metadata 90 days) are implemented with the first tables.
- Record the transfer mechanism for any US-based processor that receives personal data.
