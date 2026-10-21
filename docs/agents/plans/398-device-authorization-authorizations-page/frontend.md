# Frontend Plan: Device authorization: Authorizations page

Main plan: [plan.md](plan.md)

## Overview
Build the approver page at `#/authorizations` (route, header entry and `AppHelper` wiring already
exist from #396/#397). The page lists the user's open device-login requests and lets them
authorize (with password) or deny each one. Spec:
`docs/agents/specs/authorization/approver-page.md`, endpoints in
`docs/agents/specs/authorization/http-contract.md`.

## Context
- `frontend/assets/js/components/pages/Authorizations.jsx` is a placeholder (`<h1>Authorizations</h1>`)
  covered by `frontend/spec/components/pages/Authorizations_spec.js`.
- `frontend/assets/js/client/AuthorizationRequestsClient.js` has `create`/`poll` and a private
  `#post` that sends `X-Skip-Cache: 1`; methods return the raw `fetch` `Response`.
- `utils/authState.js` exposes `setLoggedIn`; `utils/LoginModalEvents.js` exposes
  `open(mode)` (`MODE_PASSWORD`).
- Pages follow `Kinds.jsx` → `controllers/KindsController.js` (extends `BasePageController`,
  `buildEffect()`, `buildSafeSetter`) → `helpers/KindsHelper.jsx` (static `renderLoading`,
  `renderError`, `render`), using `LoadingMessage` and `ErrorContainer`.

Endpoints (all `POST`, `{}` body unless noted, errors `{ message }`, `401` when logged out):
- `/auth/authorization-requests/mine.json` → `{ requests: [{ uuid, requestIp, requestUserAgent, createdAt, expiresAt, keepSignedIn }] }`
- `/auth/authorization-requests/:uuid/authorize.json` body `{ password }` → `{ authorized: true }`
- `/auth/authorization-requests/:uuid/deny.json` → `{ denied: true }`

## Steps

- [01 — Extend AuthorizationRequestsClient](frontend/01-extend-client.md)
- [02 — AuthorizationsController](frontend/02-controller.md)
- [03 — AuthorizationsHelper](frontend/03-helper.md)
- [04 — Wire the Authorizations page](frontend/04-page.md)

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- Decided in discussion: expiry shows as "Expires in N min" (computed at load/refresh, "Expired"
  when past); on `authorize` `400` the inline form stays open and the password is cleared.
- No automatic polling; ages/expiry are only recomputed on load/refresh (or re-render).
- On `401` the controller must not set a page or row error and must leave the list untouched.
- The page does not check login state before loading; a logged-out visit gets `401`.
- Time-based text should take an injectable "now" (or be computed from a passed `Date`) so specs
  are deterministic.
