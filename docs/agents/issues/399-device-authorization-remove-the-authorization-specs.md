# Issue: Device authorization: remove the authorization specs

## Description
Last sub-issue of Epic #391 (device authorization login, "Authorize with logged device"). All the implementing sub-issues (#393–#398) are merged. Following the spec lifecycle in `docs/agents/specs.md`, the Epic's last issue deletes the temporary spec. Before it does, the lasting parts of the spec are copied into the permanent docs, so device authorization stays documented after the spec is gone.

## Problem
- `docs/agents/specs/authorization.md` and `docs/agents/specs/authorization/` (9 topic files) are temporary design documents. With the Epic implemented they are now stale, and the spec hub still lists the feature as active.
- No permanent doc covers device authorization. `docs/agents/routes/utility-routes.md` only lists the old login, check and logoff routes. Deleting the spec as-is would leave nothing that documents the new endpoints, the `keep_signed_in` login param, the Authorizations page or the login-modal event bus.

## Expected Behavior
- The spec files are gone, and `docs/agents/specs.md` lists no active specs.
- The permanent docs describe what device authorization is, how it works and which routes it adds, without design-time detail (sub-issue map, sequencing, "today vs. new" comparisons).
- No doc in the repo links to a deleted spec file.

## Solution
1. **Preserve lasting parts** (before deleting, using the spec as the source and checking it against the code that was actually merged):
   - **Backend routes**: in `docs/agents/routes/utility-routes.md`, add a "Device Authorization" section with the five endpoints (create, poll, mine, authorize, deny): method, path, auth requirement and a one-line description. Document the `keep_signed_in` param on `POST /users/login` in the Session section. Update the summary line in `docs/agents/routes/index.md`.
   - **Frontend route**: add the `#/authorizations` page (Account → Authorizations) to the route docs, next to the existing SPA pages in `docs/agents/routes/resource-routes.md` (or wherever frontend pages are listed).
   - **Short architecture note**: a new concise page (e.g. `docs/agents/architecture/device-authorization.md`, under ~150 lines) linked from `docs/agents/architecture/index.md`. It covers the requester/approver roles, the request status machine, the `authorization_requests` table, lockout columns and settings, "Keep me signed in", and the key security mitigations.
   - **Frontend pattern**: document the login-modal event bus / `onAuthSuccess` and the Account dropdown briefly in `docs/agents/frontend/` (e.g. `component-pattern.md`, or a short section linked from `frontend/index.md`).
2. **Delete** `docs/agents/specs/authorization.md` and the whole `docs/agents/specs/authorization/` folder.
3. **Update the hub**: in `docs/agents/specs.md`, replace the Active specs table with the line "No active specs.", as the lifecycle section says. **Keep `docs/agents/specs.md`**, the permanent hub.
4. **Fix references**: grep the repo for `specs/authorization` and remove or redirect any remaining links (the issue/plan files under `docs/agents/issues` and `docs/agents/plans` are historical records and can stay as they are).

Out of scope: closing Epic #391 (handled through GitHub's sub-issue tracking or by hand, not by this PR).

## Agent
architect (docs only, no code changes)

## Benefits
- Follows the spec lifecycle and keeps the specs hub accurate.
- The feature stays documented in the permanent docs, so future agents can find its routes, data model and frontend patterns without the deleted spec.
