# Add PhotoMigration page and helper
Create the `PhotoMigration.jsx` component, wiring `useState` setters into `PhotoMigrationController` through `useMemo`/`useEffect`, the same way `KindNew.jsx` does. It then renders through `PhotoMigrationHelper`.

`PhotoMigrationHelper` (static methods, Bootstrap classes like the other helpers):
- `renderLoggedOut()`: an info message asking the user to log in, with no button.
- `render(status, totals, error, { onStart, onStop })`, inside `container mt-4`:
  - Title "Photo migration" and a short explanation.
  - One button:
    - in `idle`: **Start** (enabled);
    - in `running`: **Stop** (enabled);
    - in `stopping`: **Stopping…** (disabled);
    - in any terminal status: disabled, with a label that reflects the outcome.
  - Progress: migrated count, `remaining` (shown once known), and missing/failed counts.
  - Final status message:
    - `done`: "All photos migrated.";
    - `stopped`: "Stopped.";
    - `noProgress` with `remaining > 0`: "N photos could not be migrated now (see failures); try again in a few minutes.";
    - `error`: an alert with the error.
  - Missing ids list and failed list (`#id — reason`), each rendered only when not empty.

Jasmine specs:
- the helper renders each status, the button state/label, and the lists;
- the component spec follows the existing `pages/*_spec.js` style.

## Files to Change
- `frontend/assets/js/components/pages/PhotoMigration.jsx` — new page component.
- `frontend/assets/js/components/pages/helpers/PhotoMigrationHelper.jsx` — new helper.
- `frontend/spec/components/pages/PhotoMigration_spec.js` — new component spec.
- `frontend/spec/components/pages/helpers/PhotoMigrationHelper_spec.js` — new helper spec.
