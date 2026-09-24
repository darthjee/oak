# Issue: PhotoSubmitRequestHandler has too many methods (PHPMD TooManyMethods)

## Description
Codacy (PHPMD `rulesets-codesize.xml-TooManyMethods`, Complexity/Warning) flags `proxy/extension/PhotoSubmitRequestHandler.php:38`:
> The class PhotoSubmitRequestHandler has 11 non-getter- and setter-methods. Consider refactoring PhotoSubmitRequestHandler to keep number of methods under 10.

https://app.codacy.com/p/681941/issues/index?resultDataId=131541249805

## Problem
`PhotoSubmitRequestHandler` mixes three responsibilities in one class: request parsing/validation (`parsePath`, `validateUpload`, `hasAllowedExtension`), the backend status-gate calls (`gateUrl`, `callGate`), and file storage (`storeVersions`, `storeFailure`, `destination`, `moveUpload`), plus `__construct`, `build` and `processsRequest`.

`PhotoDeleteRequestHandler` has already been split along these lines: it delegates backend calls to `PhotoDeleteBackendGateway` and filesystem work to `PhotoFileDeleter`.

## Expected Behavior
- Codacy no longer reports TooManyMethods for `PhotoSubmitRequestHandler`, and the new classes don't trigger it (or other PHPMD/PHPCS rules) either.
- Submit behaviour is unchanged: same status codes, error messages, gate calls (`uploading` then `ready`, with the forwarded Cookie), rollback on failure, and log line.
- `docker compose run --rm extension_tests` (PHPUnit on `darthjee/tent-test`) still passes.

## Solution
Follow the delete-handler split, all in `proxy/extension/` (namespace `Oak\Proxy`):
- **`PhotoSubmitBackendGateway`**: takes `host` and `HttpClientInterface`; owns `gateUrl` + `callGate` (the PATCH `{status}` calls that forward the Cookie header). Public methods along the lines of `markUploading(segments, cookie)` / `markReady(segments, cookie)`, mirroring `PhotoDeleteBackendGateway`.
- **`PhotoVersionStorer`**: takes `storageRoot`, `PhotoPathGuard` and `PhotoImageResizer`; owns `storeVersions`, `destination`, `moveUpload` and the rollback/logging half of `storeFailure`. The `ORIGIN_PREFIX` and `VERSIONS` constants move with it. Returning the 502 `Response` can stay in the handler (e.g. the storer returns an error message or null) so the storer doesn't need `PhotoRequestHandlerHelpers`.
- The handler keeps `__construct`, `build`, `processsRequest`, `parsePath`, `validateUpload`, `hasAllowedExtension` and orchestrates the flow.
- Keep the constructor and `build` signatures unchanged, so the rules files and `PhotoSubmitRequestHandlerTest` (which injects `FakeHttpClient`) keep working.
- Register the new files in `proxy/extension/loader.php` before `PhotoSubmitRequestHandler.php`.
- **Do not rename `processsRequest`**: it's the abstract hook name from Tent's `RequestHandler` (`PhotoDeleteRequestHandler` overrides the same name).
- Coverage stays in `PhotoSubmitRequestHandlerTest` (same as the delete split, which has no separate gateway/deleter tests).
- Update the class docblock and `docs/agents/specs/photo/*` where they describe where resizing/storage happens (e.g. `resizing.md`).

## Benefits
- Clears the Codacy finding.
- Each class has one responsibility and mirrors the delete-flow structure, so the two handlers read the same way.
