# Plan: Device authorization: backend approver endpoints (mine, authorize, deny)

Issue: [395-device-authorization-backend-approver-endpoints-mine-authorize-deny.md](../../issues/395-device-authorization-backend-approver-endpoints-mine-authorize-deny.md)

## Overview
This plan builds the approver-side backend on top of #394's `AuthorizationRequest` model and `Auth::AuthorizationRequestsController`, both already on `main`. The order is:
1. the schema and settings for the lockout;
2. the `User` lockout rules;
3. the request transitions and the list decorator;
4. the endpoints.

## Context
- **Specs:** `docs/agents/specs/authorization/`. The relevant files are `http-contract.md` (mine/authorize/deny), `data-model.md` (lockout columns and settings), `status-machine.md` and `security.md` (audit logs).
- **Expiry is computed on read** (`AuthorizationRequest#expired?`, `#current_status`, scope `not_expired`). Bulk status writes go through `AuthorizationRequest.transition_all` (`update_all`).
- **`claim!` already uses the conditional-update pattern** that `authorize!`/`deny!` will mirror.
- **The controller doesn't include the `LoggedUser` concern,** which would map `NotLogged` to `404`. It instantiates `LoggedUser::Processor` directly, so it can map `Oak::Exception::NotLogged` to `401` locally without touching other endpoints.
- **Logged-in controller specs** set `controller.send(:cookies).signed[:session] = session.id` (see `spec/controllers/user/categories_controller_spec.rb`).

## Steps

- [01 — Lockout columns and settings](backend/01-lockout-columns-and-settings.md)
- [02 — User lockout rules](backend/02-user-lockout.md)
- [03 — Request transitions and list decorator](backend/03-request-transitions-and-list-decorator.md)
- [04 — Approver endpoints](backend/04-approver-endpoints.md)

## CI Checks
- `source`: `cd source && bundle exec rspec` and `cd source && bundle exec rubocop`

## Notes
- **Business errors are `400`.** Unknown uuid and another user's request also answer `400`, not `404`. Never answer `403` or `404` from these three actions.
- **Check order is fixed by the spec:**
  1. logged out
  2. unknown, or not yours
  3. not open, or expired
  4. locked (authorize only)
  5. wrong password (authorize only)
- **While locked, never call `verify_password!`.** Locked users must not learn whether a password is correct.
- **Logs never include the password or the poll token.**
- **Concurrency on the counter:** the failed-attempts counter may race under concurrent wrong passwords. Use an atomic increment (`increment_counter`, or `update_all` with SQL arithmetic) where cheap; exact precision under heavy concurrency isn't required.
