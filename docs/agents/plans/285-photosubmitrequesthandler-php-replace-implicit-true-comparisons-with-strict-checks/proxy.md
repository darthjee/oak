# Proxy Plan: PhotoSubmitRequestHandler.php: replace `!`/implicit true comparisons with strict checks

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Replace `!`/implicit-true checks with explicit strict comparisons
In `proxy/extension/PhotoSubmitRequestHandler.php`, rewrite each of the 8 Codacy-flagged conditions to the explicit `=== FALSE` / `=== TRUE` form, following the exact convention already applied in `PhotoDeleteRequestHandler.php` (issue #284, PR #296):

- line 122: `if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {` → only the leading `!$file` becomes `$file === FALSE`; the existing `!==` stays as-is (already strict).
- line 126: `if (!$this->hasAllowedExtension($file['name'] ?? '')) {` → `if ($this->hasAllowedExtension($file['name'] ?? '') === FALSE) {`
- line 139: `if (!$gateResponse->isSuccessful()) {` → `if ($gateResponse->isSuccessful() === FALSE) {`
- line 149: `if (!$this->writeFile($file['tmp_name'], $filePath)) {` → `if ($this->writeFile($file['tmp_name'], $filePath) === FALSE) {`
- line 155: `if (!$finalizeResponse->isSuccessful()) {` → `if ($finalizeResponse->isSuccessful() === FALSE) {`
- line 270: `if (!is_array($decoded) || !isset($decoded['file_path']) || !is_string($decoded['file_path'])) {` → reformat as a multi-line `if (\n    is_array($decoded) === FALSE\n    || isset($decoded['file_path']) === FALSE\n    || is_string($decoded['file_path']) === FALSE\n) {`, matching `PhotoDeleteRequestHandler::extractFilePath()`'s equivalent chain.
- line 294: `if (!is_dir($dir)) {` → `if (is_dir($dir) === FALSE) {`
- line 304: `if (is_uploaded_file($tmpName)) {` → `if (is_uploaded_file($tmpName) === TRUE) {`

No other logic changes — this is a pure comparison-style rewrite with identical control flow. Existing tests in `proxy/extension_tests/PhotoSubmitRequestHandlerTest.php` should continue to pass unchanged; no new test cases are needed since behavior is unaffected.

## Files to Change
- `proxy/extension/PhotoSubmitRequestHandler.php` — replace the 8 flagged conditions with explicit `=== FALSE`/`=== TRUE` checks.

## CI Checks
- `proxy/`: `docker compose run --rm extension_tests` (CI job: `proxy-tests`)

## Notes
- Purely mechanical/style change; verify with Codacy (or `phpcs`, if run locally via the `darthjee/tent-test` image) that the `Squiz.Operators.ComparisonOperatorUsage` findings are cleared after the change.
