# Issue: Device authorization: Authorizations page

## Description
Part of Epic #391 (device authorization login). A logged-in user approves or denies login
requests from other devices on the **Authorizations** page, reached from **Account → Authorizations**
in the header. Specs: `docs/agents/specs/authorization/approver-page.md` and
`docs/agents/specs/authorization/http-contract.md`.

Already in place (from #396 / #397): the `#/authorizations` route (key `authorizations`) in
`utils/HashRouteResolver.js`, the Account dropdown entry, the placeholder
`components/pages/Authorizations.jsx` wired in `AppHelper.jsx`, `LoginModalEvents`, and
`AuthorizationRequestsClient` with `create`/`poll`. The backend endpoints `mine`, `authorize` and
`deny` exist (#395).

## Problem
The Authorizations page is a placeholder, so a logged-in user has no way to see, approve or deny
pending login requests from other devices — the device authorization flow cannot complete.

## Expected Behavior
- The page shows a short warning: only approve requests you started yourself.
- On mount, and on every **Refresh** click, it loads the user's open requests from
  `POST /auth/authorization-requests/mine.json`. No automatic polling.
- An empty list shows a "no pending requests" message. A non-`401` load failure shows a
  page-level error; Refresh stays available.
- Each row shows IP (`requestIp`), User-Agent (`requestUserAgent`), age from `createdAt`
  ("just now" under a minute, otherwise "N min ago"; hours for older), expiry from `expiresAt`
  as "Expires in N min" (computed at load/refresh; "Expired" when in the past), and a
  "Keep signed in" badge only when `keepSignedIn === true`.
- **Deny** calls `deny(uuid)`. **Authorize** reveals an inline password field and a **Confirm**
  button on that row; Confirm calls `authorize(uuid, password)`. Row state (password, form open,
  row error) is kept per `uuid`.
- On success of either action: clear the row error and reload the list.
- On `400`: show the response's `message` on that row; the row stays. For `authorize`, the
  inline form stays open and the password field is cleared.
- On `401` from any call: `authState.setLoggedIn(false)`, then `LoginModalEvents.open('password')`;
  no page or row error, list left as is.

## Solution
- Extend `client/AuthorizationRequestsClient.js` with `mine()`, `authorize(uuid, password)` and
  `deny(uuid)`, reusing the private `#post` (sends `X-Skip-Cache: 1`).
- Replace the placeholder `components/pages/Authorizations.jsx` with the real page, split into a
  controller (under `components/pages/controllers/`) and a helper (under
  `components/pages/helpers/`), following the existing page component pattern. The route,
  `AppHelper` wiring and header entry stay as they are.
- Tests (Jasmine): client methods; page controller (load, refresh, authorize, deny, empty list,
  load error, `400` and `401` paths); helper rendering (rows, age, badge, inline form, errors).

Agent: frontend.

## Benefits
Completes the approver side of the device authorization flow, letting a user sign in on a new
device by approving the request from a session they already trust.
