# Wire the new rule

Register a new Tent rule matching `POST /uploads/photos/:id/submit` to the custom handler from [01](01-custom-submit-handler.md), following the existing pattern in `docker_volumes/proxy_configuration/rules/{backend,frontend,redirects}.php` (each a plain PHP file calling `Configuration::buildRule()`, required from `configure.php`).

The exact rule syntax for a *custom* handler class (vs. the built-in `default_proxy`/`proxy`/`static` `type`s) isn't shown in `docs/agents/external/tent/*.md` — confirm against Tent's source for the pinned `darthjee/tent:0.10.1` version whether `'handler'` accepts a `'class'` key the way `'matchers'`/`'middlewares'` do, or a different registration shape.

## Files to Change

- `docker_volumes/proxy_configuration/rules/uploads.php` — new; one `Configuration::buildRule()` call matching `['method' => 'POST', 'uri' => '/uploads/photos/', 'type' => 'begins_with']` (or `regex`, if the trailing `/:id/submit` needs to be captured) to the custom handler.
- `docker_volumes/proxy_configuration/configure.php` — add `require_once __DIR__ . '/rules/uploads.php';` alongside the existing three requires.
