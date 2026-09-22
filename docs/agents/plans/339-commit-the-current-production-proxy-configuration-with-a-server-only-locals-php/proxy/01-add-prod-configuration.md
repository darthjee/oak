# Add proxy/prod_configuration and gitignore locals.php
Create the committed prod config. It must behave exactly like the live one, with the host and path values read from `locals.php`.

- `proxy/prod_configuration/.keep`: empty.
- `proxy/prod_configuration/configure.php`: the same `use` header as the dev `configure.php`. Then `require_once __DIR__ . '/locals.php';` **first**, then `rules/frontend.php`, `rules/backend.php`, `rules/redirects.php`, in that order. No `if/else`, no `backend_legacy`.
- `proxy/prod_configuration/locals.php.sample`:
  ```php
  <?php

  $backendHost = 'https://oak-api.ffavs.net/';
  $staticRoot = '/home/darthjee_oak/oak.ffavs.net';
  ```
- `rules/frontend.php`: two static rules with `location => $staticRoot . '/static'`:
  - `GET /assets` (begins_with)
  - `GET /` (exact), with `Tent\Middlewares\SetPathMiddleware` `path => '/index.html'`
- `rules/backend.php`: `default_proxy`, `host => $backendHost`, `skip_cache_header => 'X-Skip-Cache'`, matcher `['uri' => '.json', 'type' => 'ends_with']`.
- `rules/redirects.php`: `default_proxy` with `host => $backendHost`, matcher GET regex `/^\/(?!#\/)/`, and `Tent\Middlewares\RedirectMiddleware` (`pattern => '/^(\/.*)$/'`, `replacement => '/#$1'`). Keep the doc comment explaining that it is loaded last.
- `.gitignore`: add
  ```
  # Production proxy host configuration (set only on production servers)
  proxy/prod_configuration/locals.php
  ```

## Files to Change
- `proxy/prod_configuration/.keep` — new
- `proxy/prod_configuration/configure.php` — new entry point, loads locals first
- `proxy/prod_configuration/locals.php.sample` — new, documents `$backendHost`, `$staticRoot`
- `proxy/prod_configuration/rules/frontend.php` — new, uses `$staticRoot`
- `proxy/prod_configuration/rules/backend.php` — new, uses `$backendHost`
- `proxy/prod_configuration/rules/redirects.php` — new, uses `$backendHost`
- `.gitignore` — ignore the real `locals.php`
