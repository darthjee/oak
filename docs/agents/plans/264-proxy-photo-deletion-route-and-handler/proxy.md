# Proxy Plan: Proxy — photo deletion route and handler

Main plan: [plan.md](plan.md)

## Steps

- [01 — Add a shared path-traversal guard and retrofit PhotoSubmitRequestHandler](proxy/01-add-path-traversal-guard.md)
- [02 — Create PhotoDeleteRequestHandler](proxy/02-create-delete-handler.md)
- [03 — Wire the DELETE proxy rule](proxy/03-wire-proxy-rule.md)
- [04 — Add PHPUnit coverage](proxy/04-add-tests.md)

## CI Checks

- `proxy/`: `docker compose run --rm extension_tests` (CI job: `proxy-tests` in `.circleci/config.yml`, runs `vendor/bin/phpunit` against `proxy/extension` + `proxy/extension_tests`)

## Notes

- Backend contract is already merged (#263): `POST /categories/:category_slug/items/:item_id/photos/:id/deletable.json`
  returns `200 { file_path }` when `ready`, `422` when not ready, `403` when
  not the owner, or a redirect when not logged in; `DELETE /categories/:category_slug/items/:item_id/photos/:id.json`
  removes the row and returns `200`/`403`/`404`. No backend work is in scope here.
- Only `oak_proxy`/`oak_sidekiq` mount the photos volume in `docker-compose.yml`
  (`./dev_public_files:/tmp/photos`) — `oak_app` does not, which is why the
  file unlink must happen in the proxy rather than in Rails.
- Frontend trigger/UI for delete is a separate sub-issue — out of scope here.
