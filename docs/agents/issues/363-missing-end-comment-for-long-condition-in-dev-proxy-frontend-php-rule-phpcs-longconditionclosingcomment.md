# Issue: Missing end comment for long condition in dev proxy frontend.php rule (PHPCS LongConditionClosingComment)

## Description
Codacy (PHP_CodeSniffer `PHPCS_Squiz_Commenting_LongConditionClosingComment`, Comprehensibility, Info) reports:

- `docker_volumes/proxy_configuration/rules/frontend.php:50`: End comment for long condition not found; expected "'//end if'"
  https://app.codacy.com/p/681941/issues/index?resultDataId=131495649210

## Problem
In `docker_volumes/proxy_configuration/rules/frontend.php`, the `if (getenv('FRONTEND_DEV_MODE') === 'true') { ... } else { ... }` block is about 40 lines long because the full `Configuration::buildRule([...])` arrays sit inline in each branch: one proxy rule to `http://frontend:8080` in dev mode, and two static rules for `/assets` and `/` with `SetPathMiddleware` → `/index.html` otherwise. Squiz treats this as a long condition and wants a `//end if` comment on the closing brace.

## Expected Behavior
- Codacy no longer reports the finding above.
- The dev proxy behaves exactly as before. With `FRONTEND_DEV_MODE=true`, `/`, `/assets/js/`, `/assets/css/`, `/assets/images/`, `/@vite/`, `/node_modules/` and `/@react-refresh` are proxied to `http://frontend:8080`. Without it, `/assets` and `/` (rewritten to `/index.html`) are served statically from `/var/www/html/static`.

## Solution
Shorten the conditional rather than adding a `//end if` comment. Define the rule arrays first (e.g. `$devRules` with the proxy rule and `$staticRules` with the two static rules), then use a short conditional to pick one set and call `Configuration::buildRule` for each rule in it. The rule contents (handlers, matchers, middlewares, their order) must stay the same.

Also remove the unused imports from this file (`Tent\Handlers\ProxyRequestHandler`, `Tent\Handlers\StaticFileHandler`, `Tent\Models\Server`, `Tent\Models\RequestMatcher`) and keep only `use Tent\Configuration;`. The same leftover imports in `backend.php` are out of scope.

Scope: only `docker_volumes/proxy_configuration/rules/frontend.php` (the proxy agent's scope). `proxy/prod_configuration/rules/frontend.php` has no conditional and is not affected.

Verification: start the dev proxy with and without `FRONTEND_DEV_MODE` and check that the frontend is still served in both modes.

## Benefits
- Clears a Codacy finding without adding a noise comment.
- Makes the file easier to read, with the rule definitions separated from the mode selection.
