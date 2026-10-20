# Authorization entry file

Create `docs/agents/specs/authorization.md`, the feature hub. It contains:

- **Summary.** One paragraph: a user logs in on a new device by typing only their login, and a device where they are already logged in approves the request by re-entering their password. Kerghan may be named once as the origin of the design.
- **Roles.** The requester (the new device, logged out) and the approver (a logged-in device).
- **Index.** One line per topic file, in reading order: `overview`, `status-machine`, `data-model`, `http-contract`, `keep-signed-in`, `frontend-shell`, `login-modal`, `approver-page`, `security`.
- **Sub-issue map.** Which topic files each sub-issue uses:

  | Sub-issue | Topic files |
  |---|---|
  | #393 Keep me signed in | `keep-signed-in`, `data-model` (settings), `http-contract` (login change) |
  | #394 Requester endpoints | `status-machine`, `data-model`, `http-contract`, `security` |
  | #395 Approver endpoints | `status-machine`, `data-model`, `http-contract`, `security` |
  | #396 Event bus + Account dropdown | `frontend-shell` |
  | #397 Device tab | `login-modal`, `status-machine`, `http-contract`, `frontend-shell` |
  | #398 Authorizations page | `approver-page`, `http-contract`, `frontend-shell` |
  | #399 Remove specs | `../specs.md` (lifecycle) |

  `overview.md` and `security.md` apply to all of them.

## Files to Change
- `docs/agents/specs/authorization.md` — new: feature hub (summary, roles, index, sub-issue map).
