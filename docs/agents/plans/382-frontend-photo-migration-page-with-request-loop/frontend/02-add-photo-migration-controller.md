# Add PhotoMigration controller with the request loop
Create `PhotoMigrationController extends BasePageController`, injected with state setters and a client (default `new PhotoMigrationClient()`), like the other page controllers.

State the component will hold, exposed via setters:
- `logged` (boolean);
- `status`: one of `idle`, `running`, `stopping`, `done`, `stopped`, `noProgress`, `error`;
- `totals`: `{ migrated: number, missing: number[], failed: Array<{id, reason}>, remaining: number|null }`;
- `error`: message string or null.

Behaviour:
- `buildEffect()`:
  - sets `logged` from `isLoggedIn()` and subscribes to `authState.subscribe` for updates;
  - returns a cleanup that unsubscribes and marks the controller unmounted, using `buildSafeSetter`;
  - also stops the loop on unmount, so no further request is fired.
- A constant `BATCH_LIMIT = 20`, exported or static so specs can assert it.
- `start()`:
  - only works from `idle`, which enforces one run per page load;
  - sets `running` and loops: `await client.migrate(BATCH_LIMIT)`, then merges into totals (sum `migrated`, concat `missing` and `failed`, replace `remaining`).
  - After each batch, decide:
    - `remaining === 0` → `done`;
    - `migrated + missing.length === 0` → `noProgress`;
    - Stop requested → `stopped`;
    - otherwise → next batch.
  - On a thrown error → `error`, with message:
    - 401/403: "You need to be logged in to migrate photos.";
    - otherwise: "Migration request failed (status N)." or a generic message when there is no status.
- `stop()`:
  - only works while `running`;
  - sets a stop flag and status `stopping`, which the helper shows as "Stopping after the current batch…";
  - never aborts the request in flight; the loop checks the flag after the batch has been merged into totals.
- Terminal statuses (`done`, `stopped`, `noProgress`, `error`) are final: `start()` is a no-op from them.

Jasmine specs, with a fake client that returns queued responses and `authState` toggled via `setLoggedIn`. Cover:
- the logged state initially and after a subscribe notification, plus unsubscribe on cleanup;
- accumulation across several batches;
- each stop condition: `remaining` 0, no progress, 401, 502, Stop while a request is in flight (the result is still merged and no further call is made);
- `start()` being a no-op after a terminal status;
- no request after unmount.

## Files to Change
- `frontend/assets/js/components/pages/controllers/PhotoMigrationController.js` — new controller.
- `frontend/spec/components/pages/controllers/PhotoMigrationController_spec.js` — new specs.
