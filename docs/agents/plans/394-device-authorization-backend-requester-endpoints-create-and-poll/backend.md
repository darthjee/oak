# Backend Plan: Device authorization: backend requester endpoints (create and poll)

Issue: [394-device-authorization-backend-requester-endpoints-create-and-poll.md](../../issues/394-device-authorization-backend-requester-endpoints-create-and-poll.md)

## Overview
Build the requester side of device authorization in `source/`: data model, settings, the public `create` and `poll` JSON endpoints, `X-Skip-Cache` on every response, and audit logs. The specs in `docs/agents/specs/authorization/` (`http-contract.md`, `status-machine.md`, `data-model.md`, `security.md`) are the source of truth; follow them exactly for names, defaults, status codes and JSON shapes.

## Context
- `LoggedUser::Processor#login(user, keep_signed_in: false)` already exists (#393) and sets the signed `session` cookie (persistent when `keep_signed_in`).
- `LoginController` already has the strict-boolean pattern (`BOOLEAN_VALUES`, `Oak::Exception::InvalidParameter` → `400 { message }`); reuse it.
- `ApplicationController#set_skip_cache_header` only sets `X-Skip-Cache` when a session cookie exists; the new controller must set it **always**, including on error responses.
- Settings use `setting_with_options` in `source/app/models/settings.rb`; the `:seconds` caster exists.
- No shared cache store: the rate limit and cap are counted in the database.

## Steps

- [01 — Settings](backend/01-settings.md)
- [02 — Migration and AuthorizationRequest model](backend/02-model.md)
- [03 — Create endpoint](backend/03-create-endpoint.md)
- [04 — Poll endpoint and atomic claim](backend/04-poll-endpoint.md)

## CI Checks
- `source`: `cd source && bundle exec rspec` (CircleCI rspec job)
- `source`: `rubocop` (CircleCI rubocop job)

## Notes
- The winning poll answers `{ status: "approved", session }` (the `Session::Decorator` shape), not `user`.
- Expiry is computed on read; persisting `expired` lazily is allowed but must not race with the atomic claim (the claim's `WHERE` should also require `expires_at > now`).
- Never log or store the raw `pollToken`; store only its hex SHA256 digest.
- Out of scope: `mine`/`authorize`/`deny` and the lockout (#395), frontend, cleanup of old rows.
