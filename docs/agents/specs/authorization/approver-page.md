# Approver Page (Authorizations)

Part of the [device authorization spec](../authorization.md). Implemented by #398.

## Route and placement

- Hash route **`#/authorizations`**, route key **`authorizations`**, registered in
  `utils/HashRouteResolver.js` (through `Router.js`).
- Reached from **Account → Authorizations** in the header ([frontend-shell.md](frontend-shell.md)).
- A page under `components/pages/` with a controller and a helper, following existing pages
  ([Front-End — Component Pattern](../../frontend/component-pattern.md)). Names and file split are
  left to #398.
- Uses `AuthorizationRequestsClient` (`mine()`, `authorize(uuid, password)`, `deny(uuid)`), the
  client introduced by #397 ([login-modal.md](login-modal.md)). If #398 lands first, it creates
  the client and #397 extends it.

## Content

- A short warning: **only approve requests you started yourself** (meaning, not wording).
- A **Refresh** button that reloads the list. There is **no automatic polling**.
- The list of the user's open requests, from `POST /auth/authorization-requests/mine.json`
  ([http-contract.md](http-contract.md)), loaded once on mount and on every Refresh.
- An empty list shows a "no pending requests" message.
- A load failure (non-`401`) shows a page-level error; the Refresh button stays available.

Each row shows:

| Item | Source |
|---|---|
| IP | `requestIp` |
| User-Agent | `requestUserAgent` |
| Age | from `createdAt`: "just now" under a minute, otherwise "N min ago" (hours are fine for older) |
| Expiry | from `expiresAt` (wording left to #398) |
| "Keep signed in" badge | only when `keepSignedIn === true` |

## Row actions

- **Deny** → `deny(uuid)`.
- **Authorize** → reveals an inline **password** field and a **Confirm** button on that row;
  Confirm calls `authorize(uuid, password)`.
- Row state (password value, inline form open, row error) is kept per `uuid`.
- **On success** (either action): clear that row's error and **refresh the list**, so the
  request disappears.
- **On `400`**: show the response's `message` on that row. The row stays.

## On `401` (session expired)

From any call (`mine`, `authorize`, `deny`):

1. call `authState.setLoggedIn(false)`;
2. open the login modal with `LoginModalEvents.open('password')` ([frontend-shell.md](frontend-shell.md));
3. treat the result as "nothing to do": no page error, no row error, the list is left as is.

After the user logs in again, pressing Refresh loads the list.

## Notes

- Authorizing does not change the approver's own session. The requester picks up the result on
  its next poll (within about 5 seconds).
- The page does not check the login state before loading; a logged-out visit gets `401` and goes
  through the flow above.
