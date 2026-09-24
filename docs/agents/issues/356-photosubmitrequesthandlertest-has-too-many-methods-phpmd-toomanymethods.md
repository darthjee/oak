# Issue: PhotoSubmitRequestHandlerTest has too many methods (PHPMD TooManyMethods)

## Description
Codacy (PHPMD `rulesets-codesize.xml-TooManyMethods`, Complexity, Warning) flags `proxy/extension_tests/PhotoSubmitRequestHandlerTest.php:11`: the class has 17 non-getter/setter methods; the limit is 10.
https://app.codacy.com/p/681941/issues/index?resultDataId=131542068713

## Problem
`PhotoSubmitRequestHandlerTest` holds 10 tests plus 7 helpers (`tempDirPrefix`, `successfulClient`, `captureErrorLog`, `restoreErrorLog`, `buildHandler`, `buildUploadedFile`, `buildRequest`). It still exercises everything through `PhotoSubmitRequestHandler::handleRequest`, even though #355 has since moved the storage/resize/rollback logic into `PhotoVersionStorer` and the backend gate calls into `PhotoSubmitBackendGateway`. Neither of those extracted classes has its own unit test.

## Expected Behavior
- No test class under `proxy/extension_tests/` goes over 10 non-accessor methods.
- The handler's behaviour stays covered end to end through `handleRequest`.
- `PhotoVersionStorer` and `PhotoSubmitBackendGateway` get their own unit tests.

## Solution
### 1. Shared base class
Add an abstract `PhotoSubmitRequestHandlerTestCase extends PhotoRequestHandlerTestCase` holding the shared helpers `buildHandler`, `buildRequest`, `buildUploadedFile`, `successfulClient`, `captureErrorLog` and `restoreErrorLog`, plus the `SUBMIT_PATH` constant. This follows the pattern of the earlier Codacy fixes.

### 2. Split the handler test into two classes that extend the base class
Both keep testing through `handleRequest`.
- `PhotoSubmitRequestHandlerValidationTest`: disallowed extension (415), oversized upload (413), uploading gate rejected (403 relayed, nothing written).
- `PhotoSubmitRequestHandlerStorageTest`: JPEG happy path (both gate calls, cookie forwarded, all three versions), PNG happy path, resize failure (502, rollback, not finalized, logged), path escaping the prefix folder (502, nothing written), and the deeply nested `file_path` regression.
- Drop `testTallImageKeepsItsAspectRatio` and `testSmallImageIsNotUpscaled`: `PhotoImageResizerTest` already covers both cases.
- Delete the original `PhotoSubmitRequestHandlerTest.php`.

### 3. New unit tests for the classes #355 extracted
- `PhotoVersionStorerTest`: test `store()` directly with a real `PhotoPathGuard` and `PhotoImageResizer`. On success it returns null and writes `origin/`, `photos/` and `snaps/`. If the origin write fails or the path escapes, it returns `'Failed to store uploaded file'`. If a resize fails, it returns `'Failed to resize uploaded file'`, and every written file is rolled back and the failure logged.
- `PhotoSubmitBackendGatewayTest`: test `markUploading` and `markReady` with `FakeHttpClient`. Check the method (PATCH), the gate URL built from the path segments, the `{"status":"uploading"}` / `{"status":"ready"}` bodies, cookie forwarding (present and absent), and that the backend response is returned as is.

Every new or changed test class must stay at 10 or fewer non-accessor methods. New files go through the existing `require_once` pattern in `proxy/extension_tests/`.

### Acceptance criteria
- Codacy no longer reports the finding above, and the new test classes add no new TooManyMethods, StaticAccess or similar findings.
- `docker compose run --rm extension_tests` (PHPUnit on `darthjee/tent-test`) passes.
- Production code under `proxy/extension/` does not change.

## Benefits
- Clears the Codacy warning.
- Test classes match the production classes that #355 extracted.
- `PhotoVersionStorer` and `PhotoSubmitBackendGateway` get direct unit coverage, so failures point at the class at fault.
