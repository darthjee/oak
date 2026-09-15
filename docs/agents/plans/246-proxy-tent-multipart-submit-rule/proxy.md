# Plan: Proxy — Tent multipart submit rule

Issue: [246-proxy-tent-multipart-submit-rule.md](../issues/246-proxy-tent-multipart-submit-rule.md)

## Overview

Introduce Oak's first Tent extension: a custom `RequestHandler`, mounted via a new top-level `proxy/extension/loader.php`, that handles the `multipart/form-data` "Submit" step of the photo upload flow — validating the file, gating/writing/finalizing it through calls to the backend's status-gate endpoint — and wire it into the existing `docker_volumes/proxy_configuration/` rule set and `oak_proxy` container.

**Blocked on #247** (backend status-gate/Finalize endpoint) and **#252** (proxy specialist agent) — this plan can be written now, but implementation should not start until both merge, per the issue's dependencies.

## Context

Oak's proxy config today only uses Tent's built-in `default_proxy`/`proxy`/`static` handlers (`docker_volumes/proxy_configuration/rules/{backend,frontend,redirects}.php`), none of which can parse `multipart/form-data` or write files to disk. Per `docs/agents/photo_upload/contracts.md` and `proxy-and-auth.md`, the Submit handler must:

1. Validate the file extension (allow-list `%w[jpg jpeg png]`, matching `CreateItemPhotosJob`) and a max size, before any backend call or disk write.
2. Forward the `Cookie` header and call `PATCH .../photos/:id.json` with `{ status: "uploading" }` (pre-write authorization gate) — backend responds `{ file_path }`.
3. Write the file to `<photos_path>/<file_path>`.
4. Call the same endpoint again with `{ status: "ready" }` (Finalize).
5. Respond 200 to the frontend.

Tent's extension mechanism (`docs/agents/external/tent/extending-tent.md`) mounts a `loader.php` at `/var/www/html/extension/` that `require_once`s custom classes, made available to `configure.php` by fully-qualified name. No agent currently owns `docker_volumes/proxy_configuration/` or the new `proxy/` folder (repo agents are `architect`, `backend`, `frontend` — neither `backend` nor `frontend` scope covers this; `proxy` doesn't exist until #252 lands), so this plan is owned by the `proxy` specialist agent introduced in #252.

## Steps

- [01 — Custom Submit request handler](proxy/01-custom-submit-handler.md)
- [02 — Wire the new rule](proxy/02-wire-new-rule.md)
- [03 — docker-compose and env wiring](proxy/03-docker-compose-env.md)
- [04 — Extension tests](proxy/04-extension-tests.md)

## CI Checks

- No CI job currently exercises `docker_volumes/proxy_configuration/` or a future `proxy/` folder — `upload_proxy_files` in `.circleci/config.yml` only deploys these files on release, it doesn't test them. Step 4 adds a `proxy-tests` CircleCI job (`darthjee/tent-test` image) to the `test` workflow, required by `build-and-release` alongside `test`/`checks`/`jasmine`/`frontend-checks`.
- Local equivalent: `docker run --rm -v ./proxy/extension:/var/www/html/extension -v ./proxy/extension_tests:/var/www/html/tests/extension darthjee/tent-test`.

## Notes

- Update `docs/agents/photo_upload/*.md` if the actual implementation deviates from what's documented (per the issue's scope) — not a separate step since it's conditional on what's discovered during implementation.
- `docs/agents/external/tent/extending-tent.md` shows `'class' => 'MyCustomMatcher'` for custom matchers/middlewares but has no worked example of a custom *handler* registered in `configure.php`. Confirm the exact `'handler' => ['class' => '<FQCN>', ...]` shape (vs. a new `'type'`) against Tent's source/tests for the pinned `darthjee/tent:0.10.1` version before finalizing Step 2's rule file.
- This plan has been reassigned from `architect` to the `proxy` specialist agent (#252).
