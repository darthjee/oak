# Security and Performance

Part of the [device authorization spec](../authorization.md). Applies to every sub-issue.

## Oak context

- No shared cache store in production (`cache_store` is not configured), no Redis, no
  Rack::Attack. Anything that must survive across processes lives in the database.
- CSRF protection is disabled per action (`protect_from_forgery except:`) on most JSON POSTs.
- Password login has no rate limit or lockout today.
- The Tent proxy caches backend responses unless the response carries `X-Skip-Cache`.

## Threats and mitigations

| Threat | Mitigation |
|---|---|
| **Login enumeration** | `create` answers the same `200` body for known and unknown logins; the UI always shows the waiting panel; an unknown login's request just expires. No account information reaches the requester before approval. |
| **Token leakage** | `pollToken` is long and random, returned once, kept in memory only, and stored as a SHA256 digest compared in constant time. `uuid` is a random UUIDv4, so requests cannot be guessed; polling needs both. |
| **Brute force: create flooding** | Per-IP rate limit counted in `authorization_requests` (default 5 per minute, `429`). Per-user open-request cap (default 5; the oldest open one expires). |
| **Brute force: approver password** | Per-user lockout on `authorize` stored on `users` (default 5 wrong passwords → 5-minute lock). |
| **Caching** | Every new endpoint always sends `X-Skip-Cache`; the requester has no session cookie, so the default cookie-based rule would not apply. |
| **CSRF** | The new JSON POSTs are exempt, following Oak's pattern. Rails' default `SameSite=Lax` session cookie is not sent on cross-site POSTs, and authorizing needs the password, so a forged request can at worst deny a request. |
| **Phishing** (an attacker requests access for someone else's login, hoping it is approved by mistake) | The password is required to authorize; each row shows IP, User-Agent and age; the page shows an "only approve requests you started" warning. |
| **Session fixation / reuse** | Only the first poll after approval gets a session (atomic claim); every later poll gets `logged` with no cookie. |

## Audit logging

Log, at `info` level through `Rails.logger`, with the request IP and user id (or `nil` for an
unknown login), never the `pollToken` or the password:

| Event | Sub-issue |
|---|---|
| Request created | #394 |
| Session minted (winning poll) | #394 |
| Request approved | #395 |
| Request denied | #395 |
| Wrong password / lockout triggered | #395 |

The log format is left to the backend sub-issues.

## Performance

- A poll every 5 seconds is one indexed lookup by `uuid`.
- The approver's list and the open-request cap use the `(user_id, status)` index.
- Expiry is computed on read, so no background job is needed.

## Out of scope

- User deactivation (and the reference's "user no longer approved → `denied`" rule).
- A matching confirmation code shown on both devices.
- Cleanup of old `expired` / `denied` / `logged` requests (scheduled job or on create).
- Rate limiting or lockout for regular password login.
- Unifying every logged-out response as `401` (a separate follow-up issue).
