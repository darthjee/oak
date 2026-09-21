# Issue: PhotoDeleteRequestHandler and its test have too many methods

## Description
Codacy static analysis (PHPMD `TooManyMethods`, threshold 10) flags both `PhotoDeleteRequestHandler` and its test class for exceeding the allowed method count:

- `proxy/extension/PhotoDeleteRequestHandler.php` — 11 non-getter/setter methods
- `proxy/extension_tests/PhotoDeleteRequestHandlerTest.php` — 11 non-getter/setter methods

## Problem
`PhotoDeleteRequestHandler` currently owns several distinct concerns in one class: request-path parsing, header lookup, two backend HTTP calls (the `deletable.json` gate and the row-delete call) with their URL building, JSON response parsing, disk deletion (delegating only path-safety to `PhotoPathGuard`), and error-response building.

Several of these methods (`headerValue`, `errorResponse`, `extractFilePath`, and the `parsePath`/backend-call pattern) are near-duplicates of methods already present in `PhotoSubmitRequestHandler` (`proxy/extension/PhotoSubmitRequestHandler.php`), so the duplication — not just the raw method count — is part of the underlying problem, and the fix should address both handlers, not just Delete.

The test class mirrors this: 6 test methods plus `setUp`/`tearDown` and 4 private fixture helpers (`buildHandler`, `buildRequest`, `writeExistingFile`, `removeDirRecursive`), several of which (`buildHandler`/`buildRequest`-style helpers, `removeDirRecursive`) duplicate helpers already present in `PhotoSubmitRequestHandlerTest.php`.

## Solution
Split responsibilities out of `PhotoDeleteRequestHandler` (mirroring the precedent already set by extracting `PhotoPathGuard` for path-safety):

1. Extract a small backend-gateway collaborator for the two outbound backend calls (`callBackend`, `deletableUrl`, `deleteUrl`, `extractFilePath`), so the handler only orchestrates the flow.
2. Extract disk deletion (`deleteFile`, which already delegates to `PhotoPathGuard`) into its own collaborator, keeping the handler free of filesystem concerns.
3. Move the duplicated helpers (`headerValue`, `errorResponse`) into a shared base class or trait used by **both** `PhotoDeleteRequestHandler` and `PhotoSubmitRequestHandler`, removing the duplication at its root rather than just working around the method count on the Delete side.
4. For the test file, extract the duplicated fixture helpers (`removeDirRecursive`, and the `buildHandler`/`buildRequest` pattern) into a shared base test case or trait reused by **both** `PhotoDeleteRequestHandlerTest` and `PhotoSubmitRequestHandlerTest`, then split any remaining test methods by concern (happy path, gate-rejection, cookie-forwarding) into separate test classes if still needed after the extraction.

## Benefits
- Brings both the handler and its test back under PHPMD's `TooManyMethods` threshold.
- Removes duplicated logic between `PhotoDeleteRequestHandler`/`PhotoDeleteRequestHandlerTest` and their `PhotoSubmitRequestHandler`/`PhotoSubmitRequestHandlerTest` counterparts, giving header-lookup, error-response building, and test fixture setup a single source of truth.
- Keeps the handler focused on orchestration, matching the separation of concerns already established by `PhotoPathGuard`.
