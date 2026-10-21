# Plan: Device authorization: remove the authorization specs

Issue: [399-device-authorization-remove-the-authorization-specs.md](../../issues/399-device-authorization-remove-the-authorization-specs.md)

## Overview
Docs-only closing step of Epic #391. First copy the lasting parts of the device-authorization spec
into the permanent docs (route docs, a short architecture page, a short frontend note). Then delete
`docs/agents/specs/authorization.md` and `docs/agents/specs/authorization/`, set the specs hub to
"No active specs." and make sure no doc links to a deleted file.

## Context
All implementing sub-issues (#393–#398) are merged. The spec lifecycle in `docs/agents/specs.md`
says the Epic's last issue deletes the spec and may copy lasting parts into the permanent docs.
Today no permanent doc mentions device authorization.

The spec is the source for what to copy, but **the merged code is the source of truth**. Where they
disagree, document the code. For example, the backend routes are drawn in
`source/config/routes/auth.rb` under the `auth` namespace with path `authorization-requests` and
param `:uuid`, so the paths are `/auth/authorization-requests/...`.

## Steps

- [01 — Document the backend routes](plan/01-document-backend-routes.md)
- [02 — Document the Authorizations frontend route](plan/02-document-frontend-route.md)
- [03 — Add the device-authorization architecture page](plan/03-add-architecture-page.md)
- [04 — Document the login-modal event bus and Account dropdown](plan/04-document-frontend-shell.md)
- [05 — Delete the spec and update the hub](plan/05-delete-spec-and-update-hub.md)

## Notes
- Steps 01–04 must be done before step 05, while the spec files still exist to read from.
- Every new or edited doc stays under the ~150-line target from `docs/agents/contributing/index.md`.
- Leave out design-time material: the sub-issue map, sequencing, "Today / New behavior" comparisons
  and references to sub-issue numbers as owners.
- Historical issue files under `docs/agents/issues/` (including this issue's own file) may keep
  mentioning the spec paths. They are records, not live links.
- No code changes, so no CI job is affected beyond the usual pipeline.
- Do not close Epic #391 from this PR.
