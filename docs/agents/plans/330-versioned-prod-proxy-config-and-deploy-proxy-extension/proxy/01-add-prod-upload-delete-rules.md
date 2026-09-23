# Add upload and delete rules to the prod config
Mirror the dev upload/delete rules into the prod config, reading host and paths from `locals.php`, and load them in the right order.

- `rules/uploads.php`: `Oak\Proxy\PhotoSubmitRequestHandler` with `host => $backendHost`, `photosPath => $storageRoot . '/origin'` (comment: #335 switches to a `storageRoot` option), `maxUploadSizeBytes => $maxUploadSizeBytes`. Matcher: `POST`, regex `#^/uploads/categories/[^/]+/items/\d+/photos/\d+/submit/?$#`.
- `rules/deletes.php`: `Oak\Proxy\PhotoDeleteRequestHandler` with `host => $backendHost`, `photosPath => $storageRoot . '/origin'`. Matcher: `DELETE`, regex `#^/uploads/categories/[^/]+/items/\d+/photos/\d+/?$#`.
- `configure.php`: require order becomes `frontend` → `uploads` → `deletes` → `backend` → `redirects`. Update the header comment to list `$storageRoot` and `$maxUploadSizeBytes`.
- `locals.php.sample`: add `$storageRoot = '/home/darthjee_oak/photos';` (persistent root with `origin/`, `photos/`, `snaps/`, outside the release dir) and `$maxUploadSizeBytes = 10 * 1024 * 1024;`.

Follow the doc-comment style of the existing prod rule files.

## Files to Change
- `proxy/prod_configuration/rules/uploads.php` — new submit rule
- `proxy/prod_configuration/rules/deletes.php` — new delete rule
- `proxy/prod_configuration/configure.php` — require the new rules before `backend.php`
- `proxy/prod_configuration/locals.php.sample` — document `$storageRoot` and `$maxUploadSizeBytes`
