# Wire the Authorizations page
Replace the placeholder `Authorizations.jsx` with the real page, following `Kinds.jsx`: hold the
state with `useState`, build the controller with `useMemo`, run `controller.buildEffect()` in
`useEffect`, and render through `AuthorizationsHelper` (loading state first, then the page with
handlers bound to the controller). Route, header entry and `AppHelper` mapping stay unchanged.

Update the page spec: it should render the loading state on first render (stub the client/`fetch`
so no real request is made), replacing the old heading-only assertion. Check `AppHelper_spec.js`
still passes for the `authorizations` page.

## Files to Change
- `frontend/assets/js/components/pages/Authorizations.jsx` — real page component.
- `frontend/spec/components/pages/Authorizations_spec.js` — update for the real page.
