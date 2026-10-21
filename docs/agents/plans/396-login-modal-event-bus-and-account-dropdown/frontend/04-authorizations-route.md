# Authorizations route placeholder
Register `router.register('/authorizations', 'authorizations')` in
`HashRouteResolver#buildRouter`, and map `authorizations` in `AppHelper`'s `PAGES` to a minimal
placeholder page component `Authorizations` (e.g. a heading "Authorizations" in a container) that
#398 will replace with the real page.

Specs: `HashRouteResolver_spec` resolves `#/authorizations` to `'authorizations'`; a small
`Authorizations_spec` renders the placeholder; extend `App_spec`/`AppHelper` coverage if those
specs enumerate pages.

## Files to Change
- `frontend/assets/js/utils/HashRouteResolver.js` — register the route.
- `frontend/assets/js/components/pages/Authorizations.jsx` — new placeholder page.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — map `authorizations`.
- `frontend/spec/utils/HashRouteResolver_spec.js` — route expectation.
- `frontend/spec/components/pages/Authorizations_spec.js` — new placeholder spec.
