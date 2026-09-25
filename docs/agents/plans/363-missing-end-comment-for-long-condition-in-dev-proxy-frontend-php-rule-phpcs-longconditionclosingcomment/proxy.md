# Proxy Plan: Missing end comment for long condition in dev proxy frontend.php rule (PHPCS LongConditionClosingComment)

Main plan: [plan.md](plan.md)

## Overview
Codacy flags `docker_volumes/proxy_configuration/rules/frontend.php:50` with `PHPCS_Squiz_Commenting_LongConditionClosingComment`: the `if (getenv('FRONTEND_DEV_MODE') === 'true') { ... } else { ... }` block is about 40 lines because the full `Configuration::buildRule([...])` arrays are inline in each branch. We will shorten the conditional instead of adding a `//end if` comment, and drop the unused `use` statements.

## Context
- The file is mounted into the dev `oak_proxy` container (`darthjee/tent:1.0.0`) at `/var/www/html/configuration/rules/frontend.php`, via `docker-compose.yml`.
- In dev mode (`FRONTEND_DEV_MODE=true`) there is one proxy rule to `http://frontend:8080` matching `GET /` (exact), `/assets/js/`, `/assets/css/`, `/assets/images/`, `/@vite/`, `/node_modules/` (begins_with) and `/@react-refresh` (exact).
- Otherwise there are two static rules on `/var/www/html/static`, registered in this order:
  1. `GET /assets` (begins_with)
  2. `GET /` (exact) with middleware `Tent\Middlewares\SetPathMiddleware` and `path => '/index.html'`
- Only `Tent\Configuration` is actually used. `ProxyRequestHandler`, `StaticFileHandler`, `Server` and `RequestMatcher` are imported but never used.
- The prod counterpart, `proxy/prod_configuration/rules/frontend.php`, has no conditional and is out of scope. So are the same leftover imports in `docker_volumes/proxy_configuration/rules/backend.php`.

## Implementation Steps

### Step 1 — Extract rule definitions and shorten the conditional
Define the rule arrays before the conditional. `$devRules` is a list holding the single proxy rule array, and `$staticRules` is a list holding the two static rule arrays, in their current order. Then select the set with a short construct and register each rule, for example:

```php
$rules = getenv('FRONTEND_DEV_MODE') === 'true' ? $devRules : $staticRules;

foreach ($rules as $rule) {
    Configuration::buildRule($rule);
}
```

Every handler, matcher and middleware value must stay byte-for-byte the same, including the order of the rules and the order of the matchers inside each rule. Keep the formatting consistent with the other rule files (4-space indent, short array syntax). Make sure no remaining control structure is long enough to trigger the Squiz sniff again; the `foreach` above is 3 lines.

### Step 2 — Remove unused imports
Delete `use Tent\Handlers\ProxyRequestHandler;`, `use Tent\Handlers\StaticFileHandler;`, `use Tent\Models\Server;` and `use Tent\Models\RequestMatcher;`, keeping only `use Tent\Configuration;`.

## Files to Change
- `docker_volumes/proxy_configuration/rules/frontend.php` — hoist rule arrays into variables, replace the long `if/else` with a short selection and a `foreach` loop, remove unused imports.

## CI Checks
- No CI job covers `docker_volumes/proxy_configuration/`. The `proxy-tests` job only exercises `proxy/extension`, `proxy/extension_tests` and `proxy/prod_configuration`.
- Local sanity check: `php -l docker_volumes/proxy_configuration/rules/frontend.php`. If PHP isn't installed locally, run it inside the proxy image: `docker compose run --rm oak_proxy php -l /var/www/html/configuration/rules/frontend.php`.

## Notes
- Manual verification: with `FRONTEND_DEV_MODE=true` in `.env`, bring up `oak_proxy` and check that `http://localhost:3000/` loads through Vite, including HMR assets under `/@vite/`. Then set `FRONTEND_DEV_MODE=false` (or unset it) and check that `/` serves `docker_volumes/static/index.html` and `/assets/...` serve static files.
- Codacy may also run other PHPCS sniffs on the new code (e.g. inline control structures or the file doc comment). Match the existing rule files rather than adding new style patterns.
