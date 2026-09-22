# Test the prod rules with inline locals
Add a tent-test PHPUnit spec that loads the prod rule files and checks which rule handles each request. The real `locals.php` is never in the repo, so the test must not require `configure.php`. It sets `$backendHost` / `$staticRoot` inline and `require`s `rules/frontend.php`, `rules/backend.php` and `rules/redirects.php` in `configure.php`'s order. Follow Majora's `DomainRouteOrderingTest.php`:
- `Configuration::reset()` before loading and in `tearDown()`.
- Keep all assertions in one test method. The rule files are loaded with `require` (not `require_once`) in the test, but keep a single method anyway so a second load never registers duplicate rules.
- Build `Tent\Models\Request` objects (`requestMethod`, `requestPath`) and look up the first matching rule's handler.

Assertions:
- `GET /` → `StaticFileHandler`
- `GET /assets/index.js` → `StaticFileHandler`
- `GET /categories.json` → `DefaultProxyRequestHandler` (backend)
- `GET /categories/1` (no `.json`) → the redirect rule (`DefaultProxyRequestHandler` with the redirect middleware). Use whatever Tent exposes on `Rule` to tell it apart from the backend rule, e.g. rule index/order.

Make `proxy/prod_configuration/` reachable from the test, as a sibling of `extension/` and `tests/`, at `<root>/prod_configuration/`. Resolve it with `dirname(__DIR__, 2) . '/prod_configuration'` from `tests/extension/`:
- `docker-compose.yml` `extension_tests` service: add the volume `./proxy/prod_configuration/:/var/www/html/prod_configuration/`.
- `.circleci/config.yml` `proxy-tests` "Link extension…" step: add `rm -rf /home/app/app/source/prod_configuration` and `cp -r proxy/prod_configuration /home/app/app/source/prod_configuration`.

Check the real paths inside `darthjee/tent-test:0.10.4` before hardcoding the `dirname` depth. Compose uses `/var/www/html`, while CI uses `/home/app/app/source`. Both place `extension/` and `tests/extension/` under one root.

## Files to Change
- `proxy/extension_tests/ProdConfigurationRoutingTest.php` — new spec
- `docker-compose.yml` — `extension_tests` mounts `proxy/prod_configuration/`
- `.circleci/config.yml` — `proxy-tests` copies `proxy/prod_configuration/` into the test layout
