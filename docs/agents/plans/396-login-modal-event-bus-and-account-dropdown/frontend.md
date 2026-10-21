# Frontend Plan: Login modal event bus and Account dropdown

Main plan: [plan.md](plan.md)

## Overview
Implement `docs/agents/specs/authorization/frontend-shell.md`: the login-modal event bus, Header
subscription and `mode` prop, the Account dropdown, and the `authorizations` route placeholder.
No backend changes.

## Context
- `Header.jsx` owns `showModal`; `HeaderHelper#renderAuth` renders a plain Logoff link when
  logged in and a Login link otherwise; `HeaderHelper#renderLoginModal` renders `LoginModal` with
  `show` / `onClose` / `onSuccess`.
- `HeaderController#buildEffect` already follows a subscribe/unsubscribe pattern for
  `utils/authState.js`; the new modal subscription follows the same shape so it is unit-testable
  (the `Header_spec` only renders statically).
- Routes are registered in `utils/HashRouteResolver.js#buildRouter` and mapped to page elements in
  `components/helpers/AppHelper.jsx` (`PAGES`).
- #397 makes `LoginModal` honour `mode`; #398 replaces the placeholder page.

## Steps

- [01 — Login-modal event bus](frontend/01-login-modal-event-bus.md)
- [02 — Header subscribes to the bus](frontend/02-header-subscription.md)
- [03 — Account dropdown and mode prop](frontend/03-account-dropdown.md)
- [04 — Authorizations route placeholder](frontend/04-authorizations-route.md)

## CI Checks
- `frontend`: `cd frontend && npm test` (CI job: `jasmine`)
- `frontend`: `cd frontend && npm run lint` (CI job: `frontend-checks`)

## Notes
- If the bus file path changes from `frontend/assets/js/utils/LoginModalEvents.js`, update
  `docs/agents/specs/authorization/frontend-shell.md` to match.
- Logoff behaviour (`HeaderController#handleLogoff`) must stay unchanged; only its placement moves.
- `onAuthSuccess` keeps today's behaviour (reload, close modal, stay on the current page).
