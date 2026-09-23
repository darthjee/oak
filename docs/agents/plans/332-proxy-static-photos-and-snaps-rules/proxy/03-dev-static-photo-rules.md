# Dev static photo rules
Create `docker_volumes/proxy_configuration/rules/photos.php` with the same two rules as prod, but `location => '/tmp/photos'` (the existing `./dev_public_files:/tmp/photos` mount). Require it in the dev `configure.php` right after `rules/frontend.php`, so it comes before the redirect catch-all. No `docker-compose.yml` change is needed.

Check it manually: `docker compose up oak_proxy`, then `curl -i` an existing file under `dev_public_files/photos/users/...` (expect 200 + `Cache-Control: max-age=604800`) and a missing one (expect 404, no max-age, no redirect).

## Files to Change
- `docker_volumes/proxy_configuration/rules/photos.php` — new static rules for dev.
- `docker_volumes/proxy_configuration/configure.php` — require `photos.php` after `frontend.php`.
