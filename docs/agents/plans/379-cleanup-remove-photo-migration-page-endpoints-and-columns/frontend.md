# Frontend Plan: Cleanup — remove photo migration page, endpoints and columns

Main plan: [plan.md](plan.md)

## Shared contracts

- Stop calling `POST /migrations/photos`. The proxy removes the rule in the same change.

## Implementation Steps

### Step 1 — Remove the migration page and client
Delete the page, its controller and helper, the client, and their specs.

### Step 2 — Unregister the route and header link
Remove the `photoMigration` page from `AppHelper`, the `/photos/migration` route from `HashRouteResolver`, and the logged-in "Photo migration" link from `HeaderHelper`. Revert `#renderKindsLink(logged = false)` to the parameterless `#renderKindsLink()` and restore its JSDoc ("Renders the always-visible Kinds navigation link." / `@returns {JSX.Element} nav item linking to the kinds list`). In `render`, call `this.#renderKindsLink()` again.

## Files to Change
- `frontend/assets/js/components/pages/PhotoMigration.jsx` — delete.
- `frontend/assets/js/components/pages/controllers/PhotoMigrationController.js` — delete.
- `frontend/assets/js/components/pages/helpers/PhotoMigrationHelper.jsx` — delete.
- `frontend/assets/js/client/PhotoMigrationClient.js` — delete.
- `frontend/spec/components/pages/PhotoMigration_spec.js`, `frontend/spec/components/pages/controllers/PhotoMigrationController_spec.js`, `frontend/spec/components/pages/helpers/PhotoMigrationHelper_spec.js`, `frontend/spec/client/PhotoMigrationClient_spec.js` — delete.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — remove the `PhotoMigration` import and the `photoMigration` entry.
- `frontend/assets/js/utils/HashRouteResolver.js` — remove `router.register('/photos/migration', 'photoMigration');`.
- `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` — remove the migration link and revert `#renderKindsLink`.
- `frontend/spec/components/helpers/AppHelper_spec.js` — remove the `photoMigration` example.
- `frontend/spec/utils/HashRouteResolver_spec.js` — remove the photo migration route example.
- `frontend/spec/components/elements/helpers/HeaderHelper_spec.js` — remove the two "Photo migration link" examples.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
