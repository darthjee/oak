# Frontend Shell

Part of the [device authorization spec](../authorization.md). Implemented by #396; used by #397
and #398.

## Today

`Header` owns `showModal` and renders `LoginModal` with `show` / `onClose` / `onSuccess`. Only
the header's Login link can open the modal, and Logoff is a plain navbar link.

## Login-modal event bus

A small module, **`LoginModalEvents`**, lets any component open or close the login modal. It is
built on a `window` `CustomEvent`. The recommended location is
`frontend/assets/js/utils/LoginModalEvents.js`; #396 picks the final path and updates this file
if it differs.

| Item | Value |
|---|---|
| Event name | `oak:login-modal` (dispatched on `window`) |
| Event `detail` | `{ open: boolean, mode: 'password' \| 'device' }` |
| `LoginModalEvents.open(mode = 'password')` | Dispatches `{ open: true, mode }`. An unknown mode falls back to `'password'`. |
| `LoginModalEvents.close()` | Dispatches `{ open: false, mode: 'password' }`. |
| `LoginModalEvents.subscribe(listener)` | Calls `listener(detail)` on every event. Returns an unsubscribe function. |

All three functions are no-ops (subscribe returns a no-op unsubscribe) when `window` is undefined.

### Who sends and who listens

| Party | Role |
|---|---|
| `Header` | **The only listener.** On `open: true` it sets `showModal = true` and the modal mode to `detail.mode`; on `open: false` it sets `showModal = false`. It subscribes on mount and unsubscribes on unmount. |
| Header's Login link | Sends `open('password')` (or sets the same state directly). |
| Authorizations page (#398) | Sends `open('password')` on a `401`. |
| Any future component | May send `open(...)` / `close()`. |

`Header` passes the mode to `LoginModal` as a **`mode`** prop (`'password'` or `'device'`,
default `'password'`). `LoginModal` (#397) switches to that mode every time the modal opens.
Until #397 lands, `LoginModal` ignores the prop.

## The modal is unavailable while logged in

When `authState.isLoggedIn()` is `true`, `Header` does not render the Login link and ignores
`open` events (it keeps `showModal = false`). A logged-in user can never start the device flow.

## The `onAuthSuccess` contract

Both password login and device approval end through the Header's `onAuthSuccess`, which:

1. re-checks `GET /users/login.json` (the existing `HeaderController#reload`);
2. calls `authState.setLoggedIn(true)` when that check returns a session;
3. sets `showModal = false`;
4. **stays on the current page** — no redirect, no hash change.

`LoginModal` receives it as the existing `onSuccess` prop and calls it with no arguments.

## Account dropdown

- Shown in the header **only when logged in**, labelled **"Account"** (a Bootstrap
  `NavDropdown`, matching the existing header markup).
- Entries, in this order:

  | Entry | Target |
  |---|---|
  | **Authorizations** | `#/authorizations` |
  | **Logoff** | the existing logoff action (`HeaderController#handleLogoff`) |

- Logoff **moves** into the dropdown; there is no separate navbar Logoff link anymore. Logoff
  behavior itself is unchanged.
- When logged out the dropdown is hidden and the Login link is shown, as today.

## Route

`#/authorizations` resolves to the route key **`authorizations`** (registered in
`utils/HashRouteResolver.js`). #396 may register the route with a placeholder; #398 owns the page.
