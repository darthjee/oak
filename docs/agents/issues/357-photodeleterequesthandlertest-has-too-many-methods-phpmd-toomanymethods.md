# Issue: PhotoDeleteRequestHandlerTest has too many methods (PHPMD TooManyMethods)

## Description
Codacy (PHPMD `rulesets-codesize.xml-TooManyMethods`, Complexity/Warning) flags `proxy/extension_tests/PhotoDeleteRequestHandlerTest.php:11`: the class has 14 non-getter/setter methods, above the limit of 10.
https://app.codacy.com/p/681941/issues/index?resultDataId=131542068714

## Problem
`PhotoDeleteRequestHandlerTest extends PhotoRequestHandlerTestCase` holds 8 tests plus 6 support methods: `setUp`/`tearDown` (silence `error_log`), `tempDirPrefix`, `buildHandler`, `buildRequest`, `writeVersions` and `versionPaths`. All the fixture logic lives in the concrete test class, and some of its tests exercise behaviour that really belongs to the handler's collaborators (`PhotoFileDeleter`, `PhotoDeleteBackendGateway`), which have no unit tests of their own.

## Expected Behavior
- Codacy no longer reports `TooManyMethods` for the delete handler tests (or the finding is marked as a false positive with a justification).
- `docker compose run --rm extension_tests` (PHPUnit on `darthjee/tent-test`) still passes.
- `PhotoFileDeleter` and `PhotoDeleteBackendGateway` get their own unit tests.
- Every behaviour currently covered stays covered — either in the handler test or in a collaborator test. No production code changes.

## Solution
Mirror the fix for #356 (`PhotoSubmitRequestHandlerTestCase`, `PhotoVersionStorerTest`, `PhotoSubmitBackendGatewayTest`):

1. **`PhotoDeleteRequestHandlerTestCase`** (abstract, extends `PhotoRequestHandlerTestCase`, in `proxy/extension_tests/`) — holds the shared constants (`DELETE_PATH`, `DELETABLE_URL`, `DESTROY_URL`, `PREFIXES`), the `error_log`-silencing `setUp`/`tearDown`, and the helpers `buildHandler`, `buildRequest`, `writeVersions`, `versionPaths` (optionally a `successfulClient($filePath)` helper for the repeated gate-200 + delete-200 `FakeHttpClient`). `writeVersions` should be reusable by `PhotoFileDeleterTest` (e.g. via a small trait, or by having that test extend `PhotoRequestHandlerTestCase`).
2. **`PhotoFileDeleterTest`** — unit tests for `PhotoFileDeleter::delete`: deletes all three versions; only some versions present; already-missing file (no-op, no directories created); a `file_path` escaping the prefix folders deletes nothing outside them.
3. **`PhotoDeleteBackendGatewayTest`** — unit tests for `checkDeletable` (POST to the `deletable.json` URL) and `deleteRow` (DELETE to the `.json` URL), forwarding the `Cookie` header when given and sending none otherwise, and relaying the backend response.
4. **Slim `PhotoDeleteRequestHandlerTest`** (now extending `PhotoDeleteRequestHandlerTestCase`) down to the orchestration cases: happy path (gate then disk then row delete), non-successful gate (422) relayed with nothing deleted, forbidden gate (403) relayed with nothing deleted, failed backend DELETE relayed with files already gone (disk-first ordering). Drop the already-missing, partial-versions, path-escape and cookie-forwarding cases now covered by the collaborator tests. If the class is still over the limit, split it into files/backend test classes instead.

## Benefits
- Clears the Codacy finding and keeps the delete-handler test layout consistent with the submit-handler one.
- `PhotoFileDeleter` and `PhotoDeleteBackendGateway` gain direct test coverage; the handler test focuses on orchestration.
