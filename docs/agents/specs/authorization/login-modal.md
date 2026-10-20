# Login Modal (Requester)

Part of the [device authorization spec](../authorization.md). Implemented by #397.

## Today

`elements/LoginModal.jsx` is a single password form (`login`, `password`, `incorrect`, `error`
states). `LoginModalController` is re-created on every render. `LoginModalClient` posts to
`/users/login.json`. There are no tabs, no modes, no register or recover flows.

## Modes

Only two modes, shown as tabs at the top of the modal:

| Mode | Tab meaning | Fields | Submit |
|---|---|---|---|
| `password` (default) | Log in with password | `login`, `password`, "Keep me signed in" | `POST /users/login.json` (unchanged + `keepSignedIn`) |
| `device` | Authorize with logged device | `login`, "Keep me signed in" | `POST /auth/authorization-requests.json` |

- There is **no** register, recover or reset-password mode.
- The modal opens in the mode given by the Header's `mode` prop ([frontend-shell.md](frontend-shell.md)).
- **Switching mode resets everything:** stops the poller, clears the countdown target, clears all
  fields (including the checkbox), errors and the result panel. Nothing carries over.
- Both modes send `keepSignedIn` as `Boolean(value)`.

## Device panels

After a device submit, a result panel **replaces** the tabs and the form:

| Panel | Shown when | Content (meaning, not wording) |
|---|---|---|
| `form` | Before submit, or after "Try again" | The device form. |
| `waiting` | After a successful create | Spinner, "waiting for another device to approve", `mm:ss` countdown to `expiresAt` (never below `00:00`). No cancel button; closing the modal cancels. |
| `denied` | Poll → `denied` | The request was denied. "Try again" button. |
| `expired` | Poll → `expired`, or local clock passes `expiresAt` | The request expired. "Try again" button. |
| `logged` | Poll → `logged` | This approval was already used. "Try again" button. |
| `notFound` | Poll → `404` | The request no longer exists. "Try again" button. |

"Try again" performs a normal switch to `device` mode, giving an empty form.

## Device submit

1. Clear any submit error.
2. Call `AuthorizationRequestsClient#create(login, keepSignedIn)`.
3. **On failure** (`400`, `429`, network): stay on `form` and show the error `message` (or a
   generic error). No poller starts.
4. **On success: always show `waiting`**, whatever the login. Never show anything like "user not
   found". Keep `pollToken` in memory only (never in storage, URL or logs).
5. Start the poller with `{ uuid, pollToken, expiresAt }`.

## Poller

- Polls `POST .../:uuid/poll.json` **every 5 seconds** through a `setTimeout` chain: the next poll
  is scheduled only after the current one finishes, so polls never overlap.
- A separate one-shot timer fires at `expiresAt` and ends with `expired` without a request. Each
  poll also checks the local clock first.
- Results follow [status-machine.md](status-machine.md):
  - `open` → schedule the next poll;
  - `approved` → stop, then call `onSuccess` (the Header's `onAuthSuccess`), which closes the
    modal and **stays on the current page**;
  - `denied` / `expired` / `logged` → stop and show that panel;
  - HTTP `404` → stop and show `notFound` (**final**);
  - network error or any other failure → stay on `waiting`, show a **"network error, retrying"**
    alert, and keep polling. The alert disappears on the next successful poll.
- **The poller stops** when: the modal closes (`onClose`, or `show` becoming `false`), the modal
  unmounts, the mode switches, the page/tab unloads, a final result arrives, or `expiresAt` passes.
  A stopped poller ignores any response still in flight. The request is left on the server and
  simply expires.

## Stable controller

`LoginModalController` must be **stable across renders** (created once with `useMemo` / `useRef`)
so a running poller survives re-renders. It receives setters, as today.

## Client

A new **`AuthorizationRequestsClient`** (Oak has no shared `ApiClient`; each component has its own
client) with at least:

- `create(login, keepSignedIn)` → `POST /auth/authorization-requests.json`;
- `poll(uuid, pollToken)` → `POST /auth/authorization-requests/:uuid/poll.json`.

#398 extends the same client with `mine()`, `authorize(uuid, password)` and `deny(uuid)`. Every
call sends `Content-Type` / `Accept: application/json` and `X-Skip-Cache: 1`, and uses the
browser's default same-origin credentials so the `session` cookie is stored on approval.

## UI copy

The specs give the meaning of each message only. Exact wording and styling are left to #397.
