# Issue: Frontend — photo migration page with request loop

## Description
Part of #251 (migrate legacy photo files to the new storage root). Legacy photos are broken in production since #336. The proxy now exposes `POST /migrations/photos?limit=N` (#381), which migrates one batch of the logged-in user's photos per call. This sub-issue adds a logged-in-only frontend page that calls that endpoint in a loop until nothing is left, showing progress and problems.

## Problem
Nothing in the UI triggers the migration. The endpoint handles one batch per call, so someone has to call it again and again and keep track of the results.

## Expected Behavior
- A new hash route `#/photos/migration` shows the `PhotoMigration` page.
- The header shows a link to it only when logged in.
- Not logged in: the page shows a message asking the user to log in, and no button.
- Logged in: a **Start**/**Stop** button drives a loop of `POST /migrations/photos?limit=N` calls:
  1. `N` is a fixed constant (20; the backend clamps to 1..50);
  2. after each batch, totals are accumulated (migrated count, `missing` ids, `failed` ids + reasons) and the latest `remaining` is shown;
  3. the loop continues while `remaining > 0` **and** the last batch made progress (`migrated + missing.length > 0`);
  4. the loop stops when `remaining` is 0, a batch made no progress, an HTTP error occurs (401/403/502/other), or **Stop** is clicked. Stop does not cancel the request in flight: the loop ends after that request finishes and its result is added to the totals.
  5. Each page load allows only one run. Once the loop ends (for any reason, **Stop** included), the button stays disabled. It cannot be started again from the page, and there is no automatic retry. To run again, reload the page.
- The page shows progress, a final status (done / stopped / no progress / error), and the `missing` and `failed` lists for manual follow-up.

### Contract (Proxy ↔ Frontend)
`POST /migrations/photos?limit=N`, authenticated by the browser session cookie.

- `401`/`403`: passed through from the backend `prepare` call.
- `502`: invalid backend response, or the backend confirm call failed.
- `200`:

```json
{ "migrated": 3, "missing": [18], "failed": [{ "id": 19, "reason": "rename failed" }], "remaining": 9 }
```

`remaining` is already adjusted for this batch: photos just set to `migrated`/`missing` are subtracted. **Failed photos are not confirmed.** They stay `migrating` on the backend, still count in `remaining`, and can only be claimed again after `MIGRATION_CLAIM_TIMEOUT` (5 minutes). So a run with failures normally ends with the "no progress" stop and `remaining > 0`. In that case, the page shows a message like "N photos could not be migrated now (see failures); try again in a few minutes."

## Solution
- `frontend/assets/js/utils/HashRouteResolver.js`: register `#/photos/migration` → new `PhotoMigration` page (component + controller + helper under `components/pages/`, following the existing page pattern).
- `frontend/assets/js/client/PhotoMigrationClient.js` (next to `PhotoUploadClient`): `migrate(limit)` → `POST /migrations/photos?limit=N`.
- `Header.jsx`: a plain "Photo migration" link to the page, shown to every logged-in user (no admin restriction, since each user migrates only their own photos), visible only when `authState.isLoggedIn` (and updated through `authState.subscribe`).
- The controller owns the loop, the accumulated totals and the stop conditions. The helper handles formatting.
- Jasmine specs: the controller loop (one per stop condition, accumulation across batches, Stop waiting for the in-flight request, button disabled after the run ends), the client, the helper, the route and the header link visibility.

### Sequencing
Develop in parallel against the contract above, with the proxy stubbed in specs. **Merge and deploy only after the proxy sub-issue (#381, merged).**

### Out of scope
- Removing the page later: #379.
- Backend or proxy changes.

## Benefits
- Each user can repair their own legacy photos from the UI, without shell access.
- Failed and missing photos end up in a visible list for manual follow-up.
