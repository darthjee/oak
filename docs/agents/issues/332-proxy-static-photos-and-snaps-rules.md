# Issue: Proxy: static /photos and /snaps rules

## Description
Serve photo files from the Oak proxy (Tent) instead of the separate `photos.oak.ffavs.net` host. Add static Tent rules for `GET /photos` and `GET /snaps` in both the dev and prod proxy configurations, with a long-lived `Cache-Control` response header. Parent: #328. Guide: `docs/agents/specs/photo/proxy-rules.md`.

## Problem
- Photos are still served from a separate host; the proxy has no rule for `/photos` or `/snaps`.
- Without a dedicated rule, `GET /photos/...` falls into the `redirects.php` catch-all and becomes a 302 to `/#/photos/...` (the SPA), even when the file is missing.
- Tent 0.10.4 has no response `Cache-Control` middleware. `SetHeadersMiddleware` sets **request** headers only, and `CacheStalenessMiddleware` needs `FileCacheMiddleware` plus an upstream host, which a `static` handler does not have.

## Expected Behavior
- `GET /photos/users/<uid>/items/<id>/<file>` and `GET /snaps/...` return the file with `Cache-Control: max-age=604800` (7 days), in dev and in prod.
- A missing file returns 404, not a redirect to the SPA, and the 404 has no `Cache-Control: max-age` header.
- Proxy specs (`extension_tests`) pass, including a spec for the new middleware and the prod routing order.

## Solution
- **Middleware:** port Majora's `CacheControlMiddleware` (`majora-3/proxy/extension/lib/middlewares/CacheControlMiddleware.php`) as `Oak\Proxy\CacheControlMiddleware` in `proxy/extension/CacheControlMiddleware.php`. Register it in `loader.php` and add a tent-test spec in `proxy/extension_tests/`. Unlike Majora's version, it sets `Cache-Control: max-age=<N>` **only on 2xx responses**. Other responses (for example a 404 for a snap that is not generated yet) are left untouched, so browsers never cache a missing photo for 7 days.
- **Prod:** new `proxy/prod_configuration/rules/photos.php` with two `static` rules (`/photos`, `/snaps`, `begins_with`), `location => $staticRoot`; files resolve through the `photos`/`snaps` symlinks in the release dir. Require it in `configure.php` right after `frontend.php`, so the order is: frontend → photos/snaps → uploads → deletes → backend → redirects. Extend `ProdConfigurationRoutingTest.php` to cover it.
- **Dev:** new `docker_volumes/proxy_configuration/rules/photos.php` with the same rules and `location => '/tmp/photos'` (the existing `./dev_public_files:/tmp/photos` mount already holds `photos/` and `snaps/`). Require it right after `frontend.php`, before the redirect catch-all. No other change to the dev order (#333 aligns it).
- **No `locals.php` change:** `$staticRoot` already exists.
- **Cache safety:** a 7-day max-age is safe. `Oak::Photo::CreateBuilder#unique_file_name` appends `SecureRandom.uuid` to every uploaded file name, so a re-upload never reuses a path.
- Update `docs/agents/specs/photo/proxy-rules.md` and `examples.md` to show that #332 is done and to use the middleware's final class name.

## Benefits
- Removes the dependency on the separate `photos.oak.ffavs.net` host.
- Photos are served straight from disk with long browser caching.
- Missing photos return a clear 404 instead of a confusing SPA redirect.
