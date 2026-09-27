# Dev and prod rules/config

Add a `migrations.php` rule file in both configurations, with the matcher `method: POST`, pattern `#^/migrations/photos/?$#`, type `regex`. Check how Tent regex matchers treat the query string: the pattern must match `/migrations/photos?limit=5`. Mirror whatever `uploads.php`/`deletes.php` rely on.

- **Dev** (`docker_volumes/proxy_configuration/`):
  - handler `Oak\Proxy\PhotoMigrationRequestHandler`;
  - `host` `http://backend:3000`;
  - `storageRoot` and `legacyRoot` both `/tmp/photos`;
  - `require_once` it in `configure.php` next to `uploads`/`deletes`.
- **Prod** (`proxy/prod_configuration/`):
  - `host` `$backendHost`, `storageRoot` `$storageRoot`, `legacyRoot` `$legacyRoot ?? $storageRoot`;
  - `require_once` it in `configure.php` after `deletes.php` and before `backend.php`;
  - add `$legacyRoot` to the host-specific values listed in the docblock.
- **`locals.php.sample`**: add a commented `$legacyRoot = '/home/darthjee_oak/photos';`, explaining that it holds the legacy `photos/` and `snaps/` files (currently the same folder as `$storageRoot`, which `photos.oak.ffavs.net` links to).

## Files to Change

- `docker_volumes/proxy_configuration/rules/migrations.php` — new dev rule.
- `docker_volumes/proxy_configuration/configure.php` — load it.
- `proxy/prod_configuration/rules/migrations.php` — new prod rule.
- `proxy/prod_configuration/configure.php` — load it and update the docblock.
- `proxy/prod_configuration/locals.php.sample` — add `$legacyRoot`.
