# Plan: Device authorization: device tab in the login modal

Issue: [397-device-authorization-device-tab-in-the-login-modal.md](../../issues/397-device-authorization-device-tab-in-the-login-modal.md)

## Overview
Turn `LoginModal` into a two-mode modal (`password`, `device`) with tabs. The `device` mode creates an
authorization request through a new `AuthorizationRequestsClient`, then an
`AuthorizationRequestPoller` polls it every 5 seconds until a final result. Waiting and final panels
replace the form. `LoginModalController` becomes stable across renders so the poller survives
re-renders.

## Context
- Backend endpoints exist since #394 (`POST /auth/authorization-requests.json`,
  `POST /auth/authorization-requests/:uuid/poll.json`).
- Since #396, `HeaderHelper#renderLoginModal` passes `mode={handlers.modalMode || 'password'}` and
  `onSuccess={handlers.onAuthSuccess}`; `utils/LoginModalEvents.js` exports `MODE_PASSWORD` and
  `MODE_DEVICE`. LoginModal currently ignores `mode`.
- Source of truth: `docs/agents/specs/authorization/login-modal.md`, `http-contract.md`,
  `status-machine.md`, `frontend-shell.md`.
- Specs render components with `renderToStaticMarkup` (effects do not run), so all logic must live in
  plain classes/functions (controller, poller, countdown formatter); components and hooks stay thin.

## Steps

- [01 — AuthorizationRequestsClient](frontend/01-authorization-requests-client.md)
- [02 — AuthorizationRequestPoller](frontend/02-authorization-request-poller.md)
- [03 — Countdown formatter and hook](frontend/03-countdown.md)
- [04 — Stable controller with modes and device submit](frontend/04-login-modal-controller.md)
- [05 — Helper: tabs, device form and panels](frontend/05-login-modal-helper.md)
- [06 — LoginModal component wiring](frontend/06-login-modal-component.md)

## CI Checks
- `frontend`: `cd frontend && npm test` (CI job: jasmine)
- `frontend`: `cd frontend && npm run lint` (CI job: frontend-checks)

## Notes
- `pollToken` must never be written to storage, the URL or logs (no `console.*` with it).
- After a successful create, always show `waiting` — never branch on whether the login exists.
- A stopped poller must ignore in-flight responses (guard every callback with the stopped flag).
- Password mode behavior and its existing specs must stay unchanged (spec expectations on the
  helper's state object will need the new keys added).
- UI wording/styling is free; keep meaning per the spec.
