# Issue: Avoid dynamic delete on computed properties in category item controllers

## Description
Codacy static analysis (ESLint `@typescript-eslint/no-dynamic-delete`, category ErrorProne) flags dynamic property deletion by computed key in two frontend controllers:

- `frontend/assets/js/components/pages/controllers/CategoryItemController.js:121` — `delete next[photoId];` inside the private static `#withoutPhotoError` helper.
- `frontend/assets/js/components/pages/controllers/CategoryItemEditController.js:210` — `delete next[photoId];` inside the private instance `#withoutPhotoError` helper.

Both helpers have the same shape: they copy an error-by-photoId map with `{ ...current }` and then delete the entry for a given `photoId` to clear that photo's delete error.

## Problem
Deleting a dynamically computed property key (`delete obj[key]`) is flagged as error-prone: it can silently no-op on typos or unexpected key collisions and is harder for static analyzers to reason about than a fixed key. It also de-optimizes the object's shape in V8.

## Solution
Replace `delete next[photoId];` in both `#withoutPhotoError` helpers with `Reflect.deleteProperty(next, photoId);`, keeping the rest of each method (the `{ ...current }` copy and return) unchanged. No behavior change is intended — this is a lint-clean refactor of the same logic.

## Benefits
- Clears the Codacy ErrorProne finding in both controllers.
- Keeps the two error-map helpers consistent with each other.
- No functional/behavioral change.
