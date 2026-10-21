# Add the device-authorization architecture page

Create a concise permanent page (under ~150 lines) that explains how device authorization works.
Condense it from `specs/authorization.md`, `overview.md`, `status-machine.md`, `data-model.md`,
`keep-signed-in.md` and `security.md`, and check names and values against the merged code (model,
migration, settings, controllers).

Suggested sections:
- **Summary and roles**: requester (new, logged-out device, types only its `login`) and approver
  (same user, already logged in, re-enters their password to authorize or denies).
- **Flow**: the end-to-end sequence (create → poll → mine → authorize/deny → poll returns a session).
- **Status machine**: request states, transitions, and what each poll result means.
- **Data model and settings**: the `authorization_requests` table, the lockout columns, and the
  related settings with their defaults.
- **Keep me signed in**: how it affects the session minted by both password login and device
  authorization.
- **Security**: the key threats and mitigations, and what is explicitly out of scope.
- **Links**: to `routes/utility-routes.md` (step 01) and the frontend note (step 04).

Link the page from the bullet list at the top of `architecture/index.md`.

## Files to Change
- `docs/agents/architecture/device-authorization.md` — new page.
- `docs/agents/architecture/index.md` — link to the new page.
