# Document the backend routes

Add the device-authorization endpoints and the `keep_signed_in` login param to the permanent route
docs. Read the endpoints from `source/config/routes/auth.rb`, the controllers
(`source/app/controllers/auth/authorization_requests_controller.rb`,
`source/app/controllers/auth/authorization_request_approvals_controller.rb`) and
`docs/agents/specs/authorization/http-contract.md`. Where the spec and the code disagree, the code wins.

- In `utility-routes.md`, add a **Device Authorization** section with a table in the existing
  format (Method | Path | Controller#Action | Description) covering the five endpoints:
  - `POST /auth/authorization-requests` (create, public)
  - `POST /auth/authorization-requests/:uuid/poll` (poll, public)
  - `POST /auth/authorization-requests/mine` (logged in)
  - `POST /auth/authorization-requests/:uuid/authorize` (logged in, requires the approver's password)
  - `POST /auth/authorization-requests/:uuid/deny` (logged in)

  Under the table, add a few short lines on the common rules that matter to callers (auth
  requirement, the 401-only-on-these-endpoints rule, main status codes).
- In the **Session** section, update the `POST /users/login` row (or add a note below the table) to
  document the optional boolean `keep_signed_in` param and its effect on session lifetime.
- In `routes/index.md`, add "Device Authorization" to the Utility Routes summary line.

## Files to Change
- `docs/agents/routes/utility-routes.md` — new Device Authorization section, plus `keep_signed_in` in Session.
- `docs/agents/routes/index.md` — summary line mentions Device Authorization.
