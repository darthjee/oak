# Prod static photo rules
Create `proxy/prod_configuration/rules/photos.php` with two rules (loop over `['/photos', '/snaps']`): handler `type => 'static'`, `location => $staticRoot`; matcher `GET`, `begins_with`; middleware `Oak\\Proxy\\CacheControlMiddleware` with `maxAgeSeconds => 60 * 60 * 24 * 7`. Add a short header comment like the other rule files.

Require it in `configure.php` right after `rules/frontend.php`. Final order: frontend → photos → uploads → deletes → backend → redirects.

Update `ProdConfigurationRoutingTest`:
- `loadProdRules()` requires `photos.php` after `frontend.php`.
- Rule count goes from 7 to 9. Shift the indexes: photos is 2, snaps is 3, uploads 4, deletes 5, backend 6, redirects 7.
- Assert `GET /photos/users/1/items/2/a.jpg` and `GET /snaps/users/1/items/2/a.jpg` match the photo rules, use a static handler and have `CacheControlMiddleware`.
- Assert `POST`/`DELETE` on `/photos/...` do not match these rules.

## Files to Change
- `proxy/prod_configuration/rules/photos.php` — new static rules.
- `proxy/prod_configuration/configure.php` — require `photos.php` after `frontend.php`.
- `proxy/extension_tests/ProdConfigurationRoutingTest.php` — cover the new rules and the updated order.
