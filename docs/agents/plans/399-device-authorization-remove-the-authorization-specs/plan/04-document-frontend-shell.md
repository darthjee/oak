# Document the login-modal event bus and Account dropdown

Condense the lasting frontend patterns from `specs/authorization/frontend-shell.md` and
`login-modal.md` into the permanent frontend docs. Check the names against the merged code under
`frontend/assets/js/` (event bus, `onAuthSuccess`, header/Account dropdown, login modal controller,
poller, authorization-requests client).

Cover briefly:
- how any component opens the login modal through the event bus, and the `onAuthSuccess` callback
  contract;
- the Account dropdown in the header (its entries, including Authorizations);
- the login modal's `password` / `device` modes and the device poller (interval, stop conditions);
- the client that wraps the authorization-requests endpoints.

Put this in a new short section of `frontend/component-pattern.md` if it fits under the line
target. Otherwise create `frontend/login-and-device-authorization.md` and link it from the bullet
list in `frontend/index.md`. Link back to `architecture/device-authorization.md`.

## Files to Change
- `docs/agents/frontend/component-pattern.md` or a new `docs/agents/frontend/login-and-device-authorization.md` — the frontend note.
- `docs/agents/frontend/index.md` — link, if a new page is created.
