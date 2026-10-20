# Overview and status machine

## `overview.md`

- **Roles.** Requester (new device) and approver (logged-in device).
- **End-to-end sequence:**
  1. The requester picks "Authorize with logged device" and submits only their `login` (plus "Keep me signed in").
  2. The server returns `{ uuid, pollToken, expiresAt }`. The waiting panel appears every time, even for an unknown login.
  3. The requester polls every 5s.
  4. The approver opens **Account → Authorizations**, presses Refresh, then authorizes with their password or denies.
  5. The requester's next poll gets the session, and the modal closes through the Header's `onAuthSuccess`, staying on the current page.
  - Draw the sequence as an ASCII diagram, like the guide's §2, but with Oak names.
- **Glossary:** authorization request, `uuid`, `pollToken`, requester, approver, keep signed in.

## `status-machine.md`

- **States:** `open`, `approved`, `logged`, `denied`, `expired`.
- **Transitions:**
  - `open → approved` (authorize);
  - `open → denied` (deny);
  - `open → expired` (the TTL passed, or the request was evicted by the per-user open-request cap);
  - `approved → logged`: the **first** poll claims the approval and mints the session. The claim is atomic on the server.
  - Every other transition is invalid.
  - There is **no** `logged → denied` transition, because user deactivation is out of scope.
- **Expiry** is computed on read. The server's expiry is what counts, and a local countdown is only for display.
- **Poll results table:**

  | Result | Panel |
  |---|---|
  | `open` | `device:waiting` |
  | `approved` + user | modal closes |
  | `denied` | `device:denied` |
  | `expired` | `device:expired` |
  | `logged` | `device:logged` |
  | `404` | `device:notFound` (final) |
  | network error | stays on `device:waiting`, shows the "retrying" alert, keeps polling |
  | local clock passes `expiresAt` | `device:expired`, no request sent |

## Files to Change
- `docs/agents/specs/authorization/overview.md` — new.
- `docs/agents/specs/authorization/status-machine.md` — new.
