# Issue: Login modal event bus and Account dropdown

## Description
Part of Epic #391 (device authorization login). Adds the frontend shell that #397 (device tab) and #398 (Authorizations page) build on: a login-modal event bus any component can use, an **Account** dropdown in the header, and the `authorizations` hash route. The contract is `docs/agents/specs/authorization/frontend-shell.md`; this issue implements it and updates the spec if a detail changes (e.g. the final file path).

## Problem
- `Header` owns `showModal` and renders `LoginModal` with `show` / `onClose` / `onSuccess`. Only the header's Login link can open the modal; the Authorizations page (#398) needs to reopen it on a `401`.
- Logoff is a plain navbar link and there is no account menu to hold an **Authorizations** entry.
- There is no route for the Authorizations page.

## Expected Behavior
- **Event bus** `LoginModalEvents` at `frontend/assets/js/utils/LoginModalEvents.js`, built on a `window` `CustomEvent` named `oak:login-modal` with `detail` `{ open: boolean, mode: 'password' | 'device' }`:
  - `open(mode = 'password')` dispatches `{ open: true, mode }`; an unknown mode falls back to `'password'`;
  - `close()` dispatches `{ open: false, mode: 'password' }`;
  - `subscribe(listener)` calls `listener(detail)` on every event and returns an unsubscribe function;
  - all three are no-ops when `window` is undefined (`subscribe` returns a no-op unsubscribe).
- **Header is the only listener.** It subscribes on mount and unsubscribes on unmount. On `open: true` it sets `showModal = true` and stores `detail.mode`; on `open: false` it sets `showModal = false`.
- **Logged in ⇒ no modal.** While logged in, Header ignores `open` events and keeps `showModal = false`; the Login link is not rendered.
- **`mode` prop.** Header passes the stored mode to `LoginModal` as `mode` (default `'password'`). `LoginModal` ignores it until #397.
- **`onAuthSuccess`** keeps today's behavior: `controller.reload()` (re-check `GET /users/login.json`, which sets `authState`), then `showModal = false`, staying on the current page.
- **Account dropdown**, shown only when logged in, labelled **Account**, styled like the existing Categories dropdown. Entries in order:
  1. **Authorizations** → `/#/authorizations`
  2. **Logoff** → the existing `HeaderController#handleLogoff` (behavior unchanged).
  The standalone navbar Logoff link is removed. When logged out, the dropdown is hidden and the Login link is shown, as today.
- **Route.** `/authorizations` is registered in `utils/HashRouteResolver.js` as route key `authorizations`, mapped in `AppHelper` to a minimal placeholder page; #398 replaces it with the real page.
- No backend changes.

## Solution
- New `utils/LoginModalEvents.js` module (the three functions above).
- `Header.jsx`: add `modalMode` state; a `useEffect` that subscribes to `LoginModalEvents` and returns the unsubscribe; ignore `open` while `logged`; the Login link may keep calling the local setter or send `LoginModalEvents.open('password')`.
- `HeaderHelper.jsx`: replace the logged-in branch of `#renderAuth` with the Account dropdown; pass `mode` to `LoginModal`.
- `HashRouteResolver.js` + `AppHelper.jsx`: register `authorizations` with a placeholder component.
- Tests (Jasmine): `LoginModalEvents` (open/close payloads, unknown-mode fallback, subscribe/unsubscribe, no `window`); Header/HeaderHelper (Account dropdown when logged in with both entries in order, no standalone Logoff, Login link when logged out, `mode` prop passed, `open` ignored while logged in); `HashRouteResolver` resolves `#/authorizations` to `authorizations`.
- Agent: **frontend**.

## Benefits
- Any component can open the login modal without prop-drilling, unblocking #397 and #398.
- A single Account menu groups account actions and gives Authorizations a home.
