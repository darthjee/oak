# Register route and header link
Wire the page into navigation:

- `HashRouteResolver.#buildRouter`: `router.register('/photos/migration', 'photoMigration')`.
- `AppHelper` `PAGES`: `photoMigration: <PhotoMigration />`.
- `HeaderHelper.render`: when `logged`, render a plain "Photo migration" nav link (`/#/photos/migration`) next to the Kinds link. It is hidden when logged out and in the loading/error shells, which already pass `logged=false`. `Header`/`HeaderController` already track `logged` through `authState.subscribe`, so no controller change is needed.

Specs:
- `HashRouteResolver_spec.js`: `#/photos/migration` resolves to `photoMigration`.
- An AppHelper spec, if one exists, renders the page for `photoMigration`.
- `HeaderHelper_spec.js`: the link is present when logged in, and absent when logged out and in the loading/error renders.

## Files to Change
- `frontend/assets/js/utils/HashRouteResolver.js` — register the route.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — map `photoMigration` to the page.
- `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` — logged-in-only link.
- `frontend/spec/utils/HashRouteResolver_spec.js` — route spec.
- `frontend/spec/components/elements/helpers/HeaderHelper_spec.js` — link visibility specs.
