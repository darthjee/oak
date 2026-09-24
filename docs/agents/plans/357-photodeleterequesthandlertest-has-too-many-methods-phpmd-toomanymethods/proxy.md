# Proxy Plan: PhotoDeleteRequestHandlerTest has too many methods (PHPMD TooManyMethods)

Main plan: [plan.md](plan.md)

## Overview
`PhotoDeleteRequestHandlerTest` has 14 methods (8 tests + 6 support methods). Mirroring the fix for #356, move its fixtures into shared helpers, give the handler's collaborators (`PhotoFileDeleter`, `PhotoDeleteBackendGateway`) their own unit tests, and keep only the orchestration cases in the handler test. No production code (`proxy/extension/`) changes.

## Context
- Base class `PhotoRequestHandlerTestCase` already provides `storageRoot` setup/teardown, `filesUnder` and `removeDirRecursive`; subclasses implement `tempDirPrefix()`.
- #356 established the pattern: `PhotoSubmitRequestHandlerTestCase` (abstract helpers), `ErrorLogCapture` (trait), `PhotoVersionStorerTest` (extends `PhotoRequestHandlerTestCase`), `PhotoSubmitBackendGatewayTest` (extends plain `TestCase`, uses `FakeHttpClient`).
- `PhotoFileDeleter::delete($filePath)` unlinks `<storageRoot>/{origin,photos,snaps}/<filePath>`, logging (via `error_log`) and skipping missing dirs/files and paths rejected by `PhotoPathGuard`.
- `PhotoDeleteBackendGateway` has `checkDeletable($segments, $cookie)` (POST `<host>/categories/<slug>/items/<item_id>/photos/<id>/deletable.json`) and `deleteRow($segments, $cookie)` (DELETE `.../photos/<id>.json`), adding a `Cookie` header only when `$cookie` is non-null, and wrapping the client result in a `Response`.

## Steps

- [01 — Extract shared delete-test fixtures](proxy/01-extract-delete-test-fixtures.md)
- [02 — Add PhotoFileDeleterTest](proxy/02-add-photo-file-deleter-test.md)
- [03 — Add PhotoDeleteBackendGatewayTest](proxy/03-add-photo-delete-backend-gateway-test.md)
- [04 — Slim PhotoDeleteRequestHandlerTest](proxy/04-slim-photo-delete-request-handler-test.md)

## CI Checks
- `proxy/extension_tests`: `docker compose run --rm extension_tests` (PHPUnit on `darthjee/tent-test`; CI copies `proxy/extension_tests` into the Tent test layout)
- Codacy PHPMD: every test class must stay at or below 10 non-accessor methods (count `setUp`/`tearDown`/`tempDirPrefix` and private helpers too).

## Notes
- New test files must `require_once` their dependencies (`FakeHttpClient.php`, `PhotoRequestHandlerTestCase.php`, new trait/base files) like the existing tests do — there is no autoloader for `extension_tests`.
- Keep each class and method small enough to avoid new Codacy findings (method count, coupling, static access, Lizard nloc).
- If the slimmed handler test still exceeds 10 methods, split it into `PhotoDeleteRequestHandlerFilesTest` / `PhotoDeleteRequestHandlerBackendTest` instead.
