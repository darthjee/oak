# Add CacheControlMiddleware
Port Majora's `CacheControlMiddleware` into Oak's extension as `Oak\Proxy\CacheControlMiddleware` (flat file, like the other extension classes; it extends `Tent\Middlewares\Middleware`).

- `build(array $attributes)` reads `maxAgeSeconds` (and `max_age_seconds` as an alias, as in Majora).
- `processResponse()`: when the response is not 2xx (`httpCode()` outside 200–299), return it unchanged. Otherwise, remove any existing `Cache-Control` header line (case-insensitive) and append `Cache-Control: max-age=<N>`, keeping every other header in order.
- Document the reason for the 2xx-only rule in the class docblock: snaps are generated asynchronously, and a cached 404 would hide them for the whole max-age.
- Add a `require_once` in `loader.php`.
- Spec cases: sets the header on a 200; replaces an existing `Cache-Control` (any case) with a single value; leaves other headers untouched; leaves 404 (and e.g. 302/500) responses unchanged; `build` accepts both option names.

## Files to Change
- `proxy/extension/CacheControlMiddleware.php` — new middleware.
- `proxy/extension/loader.php` — require the new file.
- `proxy/extension_tests/CacheControlMiddlewareTest.php` — new PHPUnit spec.
