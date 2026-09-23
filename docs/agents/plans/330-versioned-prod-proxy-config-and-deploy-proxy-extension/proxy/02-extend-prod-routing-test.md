# Cover the new rules in ProdConfigurationRoutingTest
Extend the existing single-method routing test to the new rule order.

- Add `STORAGE_ROOT` and `MAX_UPLOAD_SIZE_BYTES` constants and set `$storageRoot` / `$maxUploadSizeBytes` inline in `loadProdRules()`.
- Require the rule files in the new `configure.php` order: `frontend`, `uploads`, `deletes`, `backend`, `redirects`.
- Update the rule count and indexes (0 assets, 1 index, 2 uploads, 3 deletes, 4 backend, 5 redirects, 6 Tent fallback → 7 rules).
- Assert `POST /uploads/categories/project/items/132/photos/549/submit` matches the uploads rule with a `PhotoSubmitRequestHandler`, and the trailing-slash variant too.
- Assert `DELETE /uploads/categories/project/items/132/photos/549` matches the deletes rule with a `PhotoDeleteRequestHandler`.
- Assert the handlers got `photosPath === STORAGE_ROOT . '/origin'`, the backend host, and (submit) `maxUploadSizeBytes`, via the existing `readProperty` helper.
- Assert a `GET` on the submit path does not hit the upload rule (it still falls to `redirects`), and existing assertions keep passing with shifted indexes.

## Files to Change
- `proxy/extension_tests/ProdConfigurationRoutingTest.php` — new locals, load order, and upload/delete assertions
