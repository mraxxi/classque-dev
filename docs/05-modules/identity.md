---
trigger: always_on
---

# Identity (IDN) — Phase 0

Who is calling, and which account do they belong to. Everything else depends on this being the single choke point.

## Requirements
- **IDN-001** `getIdentity(request)` is the **only** function that reads authentication material. It returns `{ userId, accountId, email, role }` or fails with 401. No other code reads headers, cookies or tokens for identity.
- **IDN-002** Production identity: verify the Cloudflare Access JWT (`Cf-Access-Jwt-Assertion`) against the team's JWKS, checking signature, expiry, issuer and audience (`ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` environment variables). Use the verified `email` claim. Never trust `Cf-Access-Authenticated-User-Email` alone. **This depends on decision D-008 (owner confirmation).** If the owner chooses another method, only this function changes.
- **IDN-003** Local development: when `ENVIRONMENT === 'development'` and `DEV_USER_EMAIL` is set in `.dev.vars`, use that email. In any other environment this path MUST be unreachable, and a unit test proves it.
- **IDN-004** First login provisioning, in one `db.batch`: create `users` (display name = part of email before `@`), `accounts`, `memberships` (`teacher`), and one default `independent` Workplace. Initial `locale` and `timezone` come from optional headers `X-Client-Locale` and `X-Client-Timezone` (validated; fall back to `en` / `UTC`). Default Workplace name: "Independent" (`en`) or "Mandiri" (`id`).
- **IDN-005** Invite-only: there is no signup UI. Being able to pass the Access policy is the allow-list. Every verified identity is auto-provisioned on first request.
- **IDN-006** `requireAccess(identity, resourceAccountId)` compares account IDs and responds **404** (not 403) on mismatch so other accounts' IDs are not revealed. Every route touching a tenant resource calls it or filters by `identity.accountId` in SQL.
- **IDN-007** Enabled modules (`accounts.enabled_modules`) are read at `GET /api/v1/me` so the client can hide disabled modules.

## Endpoints
| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/me` | Returns user, account, memberships role, enabled modules. Provisions on first call. |
| PATCH | `/api/v1/me` | `locale`, `timezone` (valid IANA), `week_start`, `group_label`, `display_name` |
| GET | `/api/v1/health` | No auth. `{ "ok": true }`. Does not touch D1. |

## Acceptance criteria
- Given no identity, When any `/api/v1/*` route except health is called, Then 401.
- Given a new verified email, When `GET /api/v1/me` is called, Then a user, account, membership and one independent Workplace exist and are returned.
- Given user A's token and user B's group ID, When GET group is called, Then 404.
- Given `ENVIRONMENT=production` and `DEV_USER_EMAIL` set, Then the dev path is refused (test).
