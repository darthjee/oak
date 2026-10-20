# Frontend shell and login modal

## `frontend-shell.md` (#396)

- **Login-modal event bus**, like Kerghan's `LoginModalEvents`, built on a `window` `CustomEvent`. Fix these exactly:
  - the event name(s);
  - the payload (e.g. `{ mode: 'password' | 'device' }`);
  - the helper API (e.g. `open(mode)` / `subscribe(fn)`).
- **`Header`** listens to the bus and toggles `showModal`. It is the only listener. Any component can open the modal through the bus.
- **The `onAuthSuccess` contract:**
  1. re-check `GET /users/login.json`;
  2. call `authState.setLoggedIn(true)`;
  3. stay on the current page (no redirect).
- **"Account" dropdown** in the header, shown only when logged in. Its entries are **Authorizations** (`#/authorizations`) and **Logoff**, and Logoff moves into it.
- **The modal is unavailable while logged in.**

## `login-modal.md` (#397)

- **Two modes:** `password` (the default, unchanged plus the "Keep me signed in" checkbox) and `device`. There is no register or recover mode.
- **Device panels:** `form`, `waiting` (with a countdown display), `denied`, `expired`, `logged` and `notFound`. Port the guide's §6 switching rules, trimmed to two modes.
- **Device submit.** Create the request, then **always** show `waiting`. The `pollToken` is kept in memory only.
- **Poller:**
  - polls every 5s;
  - stops when the modal closes (`onClose` / `show` becoming false), on the tab or page unload, on any final status, or when the local clock passes `expiresAt`;
  - a `404` is final;
  - a network error shows the "network error, retrying" alert and polling continues.
- **Stable controller.** `LoginModalController` must be stable across renders (`useMemo` / `useRef`), so a running poller survives re-renders.
- **New client.** Add `AuthorizationRequestsClient`. Oak has no shared `ApiClient`, so each component uses its own client.
- **Approval.** On approval, call `onAuthSuccess`, which stays on the current page.
- **UI copy.** Give the meaning of each message only, not the wording.

## Files to Change
- `docs/agents/specs/authorization/frontend-shell.md` — new.
- `docs/agents/specs/authorization/login-modal.md` — new.
