# Proxy Plan: PhotoSubmitRequestHandler has too many methods (PHPMD TooManyMethods)

Main plan: [plan.md](plan.md)

## Overview
Codacy reports PHPMD `TooManyMethods` on `proxy/extension/PhotoSubmitRequestHandler.php` (11 non-accessor methods, the limit is 10). Move the backend status-gate calls and the file storage into two new collaborators, mirroring `PhotoDeleteBackendGateway` / `PhotoFileDeleter`. The handler ends up with 6 methods: `__construct`, `build`, `processsRequest`, `validateUpload`, `parsePath`, `hasAllowedExtension`.

## Context
- `processsRequest` is Tent's `RequestHandler` hook name (`PhotoDeleteRequestHandler` overrides the same name). **Do not rename it.**
- `PhotoSubmitRequestHandlerTest` builds the handler via its constructor and injects `FakeHttpClient` as the 5th argument, so the constructor and `build` signatures must stay as they are.
- The rollback test (around line 153) checks that the log line contains `photo <id>` and the `file_path`. Keep the logged message exactly as it is today.
- No new test files. The delete split added none either; `PhotoSubmitRequestHandlerTest` covers the whole flow end to end.

## Steps

- [01 — Extract PhotoSubmitBackendGateway](proxy/01-extract-backend-gateway.md)
- [02 — Extract PhotoVersionStorer](proxy/02-extract-version-storer.md)
- [03 — Wire up loader and update docs](proxy/03-loader-and-docs.md)

## CI Checks
- `proxy/extension`, `proxy/extension_tests`: `docker compose run --rm extension_tests` (CircleCI runs `vendor/bin/phpunit` inside `darthjee/tent-test`)
- Codacy (PHPMD/PHPCS) on the new files: PHPDoc on every class, property and method, and `=== FALSE` / `=== TRUE` comparisons as in the existing files.

## Notes
- Keep every status code, error message and log line identical. This is a pure refactor.
- Neither new class should need `PhotoRequestHandlerHelpers`: building `Response` errors stays in the handler.
