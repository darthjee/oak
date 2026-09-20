# Frontend Plan: Avoid dynamic delete on computed properties in category item controllers

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Fix `CategoryItemController.js`
In the private static `#withoutPhotoError` helper (around line 121), replace `delete next[photoId];` with `Reflect.deleteProperty(next, photoId);`. Keep the `{ ...current }` copy and the return value unchanged — this is a lint-only change with no behavior difference.

### Step 2 — Fix `CategoryItemEditController.js`
In the private instance `#withoutPhotoError` helper (around line 210), apply the same replacement: swap `delete next[photoId];` for `Reflect.deleteProperty(next, photoId);`, keeping the rest of the method unchanged.

## Files to Change
- `frontend/assets/js/components/pages/controllers/CategoryItemController.js` — replace `delete next[photoId]` with `Reflect.deleteProperty(next, photoId)` in `#withoutPhotoError`.
- `frontend/assets/js/components/pages/controllers/CategoryItemEditController.js` — replace `delete next[photoId]` with `Reflect.deleteProperty(next, photoId)` in `#withoutPhotoError`.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes
- No new tests are needed: `frontend/spec/components/pages/controllers/CategoryItemController_spec.js` and `frontend/spec/components/pages/controllers/CategoryItemEditController_spec.js` already exercise `deletePhoto`'s error-set and error-clear paths through `setDeleteErrorByPhotoId`, which cover `#withoutPhotoError` indirectly.
- Purely mechanical fix; `Reflect.deleteProperty` returns a boolean instead of `undefined`, but neither helper uses the return value.
