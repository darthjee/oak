# Verify method counts and split the test further only if still needed

After steps 01–04, re-run Codacy's PHPMD `TooManyMethods` check locally (or count manually) on both flagged files:

- `PhotoDeleteRequestHandler` should now have only `__construct()`, `build()`, `processsRequest()`, and `parsePath()` — 4 methods, well under the threshold of 10.
- `PhotoDeleteRequestHandlerTest` should now have its 6 `test*()` methods plus `buildHandler()`, `buildRequest()`, `writeExistingFile()`, and `tempDirPrefix()` — 10 methods, at (not over) the threshold.

If either file is still reported over the threshold (e.g. because PHPMD counts differently than expected, or `tempDirPrefix()` pushes the test class over), split `PhotoDeleteRequestHandlerTest`'s remaining test methods by concern into separate test classes (e.g. a happy-path/no-op class and a gate-rejection/cookie-forwarding class), each still extending `PhotoRequestHandlerTestCase` and each with its own `buildHandler()`/`buildRequest()` (or move those two into the shared base too, if truly identical in shape to `PhotoSubmitRequestHandlerTest`'s versions once compared — they aren't today, since `buildRequest()` differs in `uploadedFiles`/`postFields` shape, so don't force it).

Do not restructure anything if the counts already clear the threshold after steps 01–04 — this step is a checkpoint, not a mandatory further split.

## Files to Change
- `proxy/extension_tests/PhotoDeleteRequestHandlerTest.php` — split into multiple test classes only if still over the PHPMD threshold after steps 01–04.
