# Device Authorization ("Authorize with logged device")

Epic: #391. Listed in the [specs hub](../specs.md). Temporary: removed by #399.

## Summary

A user logs in on a new device by typing only their `login`, with no password on that device. A
device where the same user is already logged in then approves the request by re-entering their
own password, or denies it. The new device polls the request and, once it is approved, receives
a regular Oak session. The design comes from Kerghan's implementation and is adapted here to
Oak's Rails backend, Tent proxy and React frontend.

## Roles

- **Requester** — the new device, logged out. Opens the login modal, picks the device mode,
  types its `login` (and optionally "Keep me signed in"), then waits.
- **Approver** — a device already logged in as the same user. Opens **Account → Authorizations**,
  and authorizes (with its password) or denies each pending request.

## Topic files

Read them in this order:

1. [overview.md](authorization/overview.md) — roles, end-to-end sequence, glossary.
2. [status-machine.md](authorization/status-machine.md) — request states, transitions, what each
   poll result means.
3. [data-model.md](authorization/data-model.md) — the `authorization_requests` table, lockout
   columns, settings.
4. [http-contract.md](authorization/http-contract.md) — the five endpoints and the
   `POST /users/login.json` change.
5. [keep-signed-in.md](authorization/keep-signed-in.md) — the "Keep me signed in" option.
6. [frontend-shell.md](authorization/frontend-shell.md) — login-modal event bus, `onAuthSuccess`,
   Account dropdown.
7. [login-modal.md](authorization/login-modal.md) — `password` / `device` modes, panels, poller.
8. [approver-page.md](authorization/approver-page.md) — the Authorizations page.
9. [security.md](authorization/security.md) — threats, mitigations, out of scope.

## Sub-issue map

| Sub-issue | Agent(s) | Topic files |
|---|---|---|
| #393 Keep me signed in | backend, frontend | `keep-signed-in`, `data-model` (settings), `http-contract` (login change) |
| #394 Requester endpoints (create, poll) | backend | `status-machine`, `data-model`, `http-contract`, `security` |
| #395 Approver endpoints (mine, authorize, deny) | backend | `status-machine`, `data-model`, `http-contract`, `security` |
| #396 Event bus + Account dropdown | frontend | `frontend-shell` |
| #397 Device tab in the login modal | frontend | `login-modal`, `status-machine`, `http-contract`, `frontend-shell` |
| #398 Authorizations page | frontend | `approver-page`, `http-contract`, `frontend-shell` |
| #399 Remove these specs | architect | [../specs.md](../specs.md) (lifecycle) |

`overview.md` and `security.md` apply to every sub-issue.

**Sequencing:** #392 (this spec) → (#393, #396) → #394 → (#395, #397) → #398 → #399.

**Tests** follow Oak's own layout: RSpec under `source/spec/` for the backend and Jasmine under
`frontend/spec/` for the frontend, mirroring the source paths.

If an implementation has to deviate from these files, the implementing sub-issue updates the
affected topic file in the same PR.
