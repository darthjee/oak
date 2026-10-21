# Issue: Device authorization: device tab in the login modal

## Description
Part of Epic #391 (device authorization login). The login modal gets a second tab, **"Authorize with logged device"**. In this mode the user types only their `login` and the "Keep me signed in" checkbox. The app creates an authorization request and polls every 5 seconds until another device where the user is logged in approves or denies it.

This issue depends on #394 (requester endpoints, merged) and #396 (event bus, `mode` prop, merged). The source of truth is `docs/agents/specs/authorization/`: `login-modal.md` (modes, panels, submit, poller, client), `http-contract.md` (create and poll), `status-machine.md` and `frontend-shell.md`.

## Problem
- `elements/LoginModal.jsx` is a single password form, with no modes or tabs.
- `LoginModalController` is re-created on every render, so it cannot own a long-running poller.
- Since #396, LoginModal receives a `mode` prop (`password` or `device`) from the Header, but it ignores it.
- There is no client for `/auth/authorization-requests`.

## Expected Behavior
**Modes and tabs**
- The modal has two tabs: `password` (the default, behavior unchanged) and `device`.
- The modal opens in the mode given by the `mode` prop. When the prop changes while the modal is open, the modal switches to that mode.
- Switching mode resets everything: it stops the poller, clears the countdown target, and clears all fields (including the checkbox), errors and the result panel.
- Both modes send `keepSignedIn` as `Boolean(value)`.

**Device submit**
1. Clear the submit error.
2. Call `AuthorizationRequestsClient#create(login, keepSignedIn)`.
3. On failure (`400`, `429` or a network error), stay on the form and show the response `message`, or a generic error if there is none. No poller starts.
4. On success, **always** show the `waiting` panel. Never reveal whether the login exists.
5. Keep `pollToken` in memory only: never in storage, the URL or logs.
6. Start the poller with `{ uuid, pollToken, expiresAt }`.

**Panels** (each one replaces the tabs and the form)
- `waiting`:
  - shows a spinner and a "waiting for another device to approve" message;
  - shows an `mm:ss` countdown to `expiresAt` that never goes below `00:00`;
  - has no cancel button; closing the modal cancels.
- Final panels: `denied`, `expired`, `logged` (this approval was already used) and `notFound`.
  - Each has a **"Try again"** button.
  - "Try again" performs a normal switch to `device` mode, giving an empty form.

**Poller**
- A `setTimeout` chain polls `POST /auth/authorization-requests/:uuid/poll.json` every 5 seconds. The next poll is scheduled only after the current one finishes, so polls never overlap.
- A separate one-shot timer fires at `expiresAt` and shows `expired` without making a request. Each poll also checks the local clock first.
- Poll results:
  - `open` → schedule the next poll.
  - `approved` → stop, then call `onSuccess` (the Header's `onAuthSuccess`), which closes the modal. The user **stays on the current page**.
  - `denied`, `expired` or `logged` → stop and show that panel.
  - HTTP `404` → stop and show `notFound`. This is final.
  - Network error or any other failure → stay on `waiting`, show a "network error, retrying" alert and keep polling. The alert disappears after the next successful poll.
- The poller stops when:
  - the modal closes (`onClose`, or `show` becoming `false`);
  - the modal unmounts;
  - the mode switches;
  - the page or tab unloads;
  - a final result arrives;
  - `expiresAt` passes.
- A stopped poller ignores any response still in flight. The request is left on the server and simply expires.

## Solution
- **`client/AuthorizationRequestsClient.js`** (new), modelled on `LoginModalClient`:
  - `create(login, keepSignedIn)` → `POST /auth/authorization-requests.json`;
  - `poll(uuid, pollToken)` → `POST /auth/authorization-requests/:uuid/poll.json`.
  - Every call sends the `Accept` and `Content-Type: application/json` headers and `X-Skip-Cache: 1`, with the default same-origin credentials.
  - #398 will extend this client with `mine`, `authorize` and `deny`.
- **`AuthorizationRequestPoller`** (new): a plain class that owns the `setTimeout` chain, the expiry timer and a stopped flag. It is driven by callbacks (`onApproved`, `onFinal(panel)`, `onNetworkError(bool)`), and its timing is testable with Jasmine fake timers.
- **`LoginModalController`**:
  - is created once per modal instance (`useMemo` or `useRef`) and receives setters as today, so the poller survives re-renders;
  - gains `switchMode`, device submit, poller start and stop, and cleanup;
  - the password flow is unchanged.
- **`LoginModal.jsx`**:
  - adds state for `mode`, `panel`, `submitError`, `networkError` and `expiresAt`;
  - an effect syncs the `mode` prop and `show`, and the unmount and `pagehide` cleanup stops the poller.
- **Countdown hook** (new, for example `useCountdown(expiresAt)`): returns `mm:ss`, clamped at `00:00`.
- **`LoginModalHelper.jsx`**: renders the tabs, the device form and the panels. The exact wording and styling are left to the implementation.
- **Tests**: Jasmine specs for the client, poller, controller, countdown hook, helper and component. The existing password-mode specs must keep passing.

**Agent:** frontend.

## Benefits
- Users can log in on a new device without typing their password there.
- The flow never reveals whether a login exists.
