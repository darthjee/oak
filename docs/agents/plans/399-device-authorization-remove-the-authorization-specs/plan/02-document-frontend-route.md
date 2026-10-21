# Document the Authorizations frontend route

The approver page is a frontend-only hash route: `#/authorizations`, with route key
`authorizations`, registered in `frontend/assets/js/utils/HashRouteResolver.js` and rendered by
`frontend/assets/js/components/pages/Authorizations.jsx`. It is reached through **Account →
Authorizations** in the header. Nothing in the route docs covers it today.

Add a short **Authorizations** section to `resource-routes.md`. Like the existing Forbidden note,
it is prose rather than a Rails table, because there is no Rails resource route behind it. It
says the page is SPA-only, requires a logged-in user, lists pending requests through
`POST /auth/authorization-requests/mine`, and authorizes or denies them through the endpoints from
step 01. Add "Authorizations" to the Resource Routes summary in `routes/index.md`.

## Files to Change
- `docs/agents/routes/resource-routes.md` — new Authorizations section.
- `docs/agents/routes/index.md` — summary line mentions Authorizations.
