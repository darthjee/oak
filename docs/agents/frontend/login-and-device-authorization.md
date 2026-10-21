# Login Modal and Device Authorization

Frontend side of login and of "Authorize with logged device". For the backend flow, status
machine and security model see [Device Authorization](../architecture/device-authorization.md);
for the endpoints see [Utility Routes](../routes/utility-routes.md#device-authorization).

## Login-modal event bus

`utils/LoginModalEvents.js` lets any component open or close the login modal through a `window`
`CustomEvent` named `oak:login-modal`, with `detail` `{ open: boolean, mode: 'password' | 'device' }`.

| Function | Effect |
|---|---|
| `open(mode = 'password')` | Dispatches `{ open: true, mode }`; an unknown mode falls back to `'password'`. |
| `close()` | Dispatches `{ open: false, mode: 'password' }`. |
| `subscribe(listener)` | Calls `listener(detail)` on every event; returns an unsubscribe function. |

The mode constants `MODE_PASSWORD`, `MODE_DEVICE` and `LOGIN_MODAL_MODES` are exported from the
same module. Everything is a no-op when `window` is undefined.

`Header` is the **only listener** (`HeaderController#buildModalEffect`, subscribed while mounted).
On `open: true` it shows the modal in `detail.mode`, which it passes to `LoginModal` as the `mode`
prop; on `open: false` it hides it. While the user is logged in, `open` events are ignored, so a
logged-in user can never start the device flow. Senders today are the header's Login link and the
Authorizations page (on a `401`).

## `onAuthSuccess`

Both password login and an approved device request end through the Header's `onAuthSuccess`,
passed to `LoginModal` as `onSuccess` and called with no arguments. It re-checks
`GET /users/login.json` (`HeaderController#reload`, which updates `authState`), closes the modal
and **stays on the current page**: no redirect, no hash change.

## Account dropdown

When logged in, the header shows an **Account** dropdown (`HeaderHelper`) with **Authorizations**
(`#/authorizations`) and **Logoff** (`HeaderController#handleLogoff`). There is no separate
Logoff link. When logged out, the dropdown is hidden and the Login link is shown.

## Login modal modes

`elements/LoginModal.jsx` has two tabs:

| Mode | Fields | Submit |
|---|---|---|
| `password` (default) | `login`, `password`, "Keep me signed in" | `POST /users/login.json` with `keepSignedIn` |
| `device` | `login`, "Keep me signed in" | `AuthorizationRequestsClient#create` |

- The modal opens in the `mode` prop. Switching mode resets everything: stops the poller and
  clears fields, checkbox, errors and the result panel.
- `LoginModalController` is created once with `useMemo`, so a running poller survives re-renders.
- After a successful device submit the modal **always** shows the `waiting` panel (spinner and an
  `mm:ss` countdown to `expiresAt`), whatever the login, so login existence never leaks. A failed
  create (`400`, `429`, network) stays on the form and shows the `message`.
- Final panels: `denied`, `expired`, `logged` (approval already used) and `notFound` (poll `404`),
  each with a "Try again" button that returns to an empty device form.

## Poller

`utils/AuthorizationRequestPoller.js` polls `poll(uuid, pollToken)` every 5 seconds through a
`setTimeout` chain, so polls never overlap, plus a one-shot timer that ends the run with `expired`
at `expiresAt` without a request.

- `open` schedules the next poll; `approved` stops and calls `onApproved` (the modal's
  `onSuccess`); `denied` / `expired` / `logged` / `404` stop and call `onFinal(panel)`.
- Any other failure keeps polling and calls `onNetworkError(true)` (a "retrying" alert), then
  `onNetworkError(false)` on the next successful poll.
- The poller stops when the modal closes or unmounts, the mode switches, the page unloads
  (`pagehide`), a final result arrives or `expiresAt` passes. A stopped poller ignores in-flight
  responses. The `pollToken` is kept in memory only.

## Authorizations page

`pages/Authorizations.jsx` (with `AuthorizationsController` and `AuthorizationsHelper`) serves
`#/authorizations`. It shows a warning to approve only requests you started, a **Refresh** button
(no automatic polling) and the list from `mine()`, loaded on mount and on Refresh. Each row shows
IP, User-Agent, age, expiry and a "Keep signed in" badge when set, with **Deny** and **Authorize**
(an inline password field plus Confirm). Row state is kept per `uuid`. A success refreshes the
list; a `400` shows the `message` on that row. A `401` from any call runs
`authState.setLoggedIn(false)` and `LoginModalEvents.open('password')`, with no page or row error.

## Client

`client/AuthorizationRequestsClient.js` wraps the five endpoints: `create(login, keepSignedIn)`,
`poll(uuid, pollToken)`, `mine()`, `authorize(uuid, password)` and `deny(uuid)`. Every call is a
JSON `POST` with `Accept` / `Content-Type: application/json` and `X-Skip-Cache: 1`, using the
browser's default same-origin credentials so the `session` cookie is stored on approval.
