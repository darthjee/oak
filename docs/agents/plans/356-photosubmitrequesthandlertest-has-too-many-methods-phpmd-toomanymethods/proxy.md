# Proxy Plan: PhotoSubmitRequestHandlerTest has too many methods (PHPMD TooManyMethods)

Main plan: [plan.md](plan.md)

## Overview
Clear the PHPMD `TooManyMethods` finding on `proxy/extension_tests/PhotoSubmitRequestHandlerTest.php` by splitting it by concern, pulling its helpers into an abstract base class, and giving the two classes extracted in #355 their own unit tests. Production code under `proxy/extension/` must not change.

## Context
- `PhotoSubmitRequestHandlerTest` has 10 tests and 7 helpers (`tempDirPrefix`, `successfulClient`, `captureErrorLog`, `restoreErrorLog`, `buildHandler`, `buildUploadedFile`, `buildRequest`). PHPMD's limit is 10.
- `PhotoRequestHandlerTestCase` already provides the temp `storageRoot` setUp/tearDown, `buildImageUpload`, `filesUnder`, `removeDirRecursive` and the `PhotoImageFixtures` trait (`makeJpeg`, `makePng`, `imageInfo`, ...). `PhotoImageResizerTest` and `PhotoDeleteRequestHandlerTest` extend it.
- #355 extracted `PhotoVersionStorer` (`store(tmpName, filePath, photoId): ?string`) and `PhotoSubmitBackendGateway` (`markUploading` / `markReady(array $segments, ?string $cookie): Response`). Neither has a direct test.
- `PhotoImageResizerTest` already covers the tall-image and no-upscale cases, so their handler-level copies are dropped.
- Tests load their dependencies with `require_once __DIR__ . '/<File>.php'`. Extension classes are autoloaded by the tent-test image.

## Steps

- [01 — Extract the shared submit test base class](proxy/01-extract-submit-test-base.md)
- [02 — Split the handler test into validation and storage tests](proxy/02-split-handler-test.md)
- [03 — Add PhotoVersionStorerTest](proxy/03-add-version-storer-test.md)
- [04 — Add PhotoSubmitBackendGatewayTest](proxy/04-add-backend-gateway-test.md)

## CI Checks
- `proxy/extension_tests`: `docker compose run --rm extension_tests` (CI job: `proxy-tests`)

## Notes
- Keep every test class, the new base class included, at 10 or fewer non-accessor methods. Use the PHPCS/PHPMD conventions from the recent Codacy fixes: explicit `=== TRUE`/`=== FALSE` comparisons, no static access to production classes, and short methods for Lizard nloc.
- PHPMD counts only the methods a class declares itself, so helpers in the base class don't count against its subclasses.
- `PhotoVersionStorer::moveUpload` falls back to `rename` for files that were not uploaded through HTTP, so a `tempnam` file works as `tmpName` in the unit tests.
- Rollback logs through `error_log`. The unit tests that trigger it should capture the log with the error-log helpers so output stays quiet and they can assert on it. `PhotoVersionStorerTest` needs these helpers too, so consider putting `captureErrorLog`/`restoreErrorLog` in a small trait (e.g. `ErrorLogCapture`) that both the submit base class and `PhotoVersionStorerTest` use, instead of duplicating them.
