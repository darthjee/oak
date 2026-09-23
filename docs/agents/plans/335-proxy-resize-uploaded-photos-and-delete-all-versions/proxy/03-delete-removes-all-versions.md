# Delete removes all versions
Make delete remove `origin/`, `photos/` and `snaps/` for the photo's `file_path`.

- `PhotoDeleteRequestHandler`: replace `photosPath` with `storageRoot` in the constructor, the property and `build()` (default `/tmp/photos`). Update the docblock step 2.
- `PhotoFileDeleter`: take `storageRoot` and loop over the prefixes `origin`, `photos`, `snaps`, running the existing per-file logic with `<storageRoot>/<prefix>` as the guard root. A missing directory or file, or a path the guard rejects, is logged and skipped for that prefix only, as today.
- Keep the existing order in the handler: `deletable` gate, file delete, then the backend row delete.

Specs in `proxy/extension_tests/PhotoDeleteRequestHandlerTest.php`:
- Happy path: seed all three files; all three are gone and the backend row delete is called.
- Only some versions present (e.g. only `origin/`, as for older photos): the rest are skipped, the call still returns 200.
- Existing gate-rejection specs assert that none of the three files are removed.
- A `file_path` with `..` removes nothing outside the prefixes.

## Files to Change
- `proxy/extension/PhotoDeleteRequestHandler.php` — `storageRoot` option, docblock.
- `proxy/extension/PhotoFileDeleter.php` — delete under all three prefixes.
- `proxy/extension_tests/PhotoDeleteRequestHandlerTest.php` — updated and new specs.
