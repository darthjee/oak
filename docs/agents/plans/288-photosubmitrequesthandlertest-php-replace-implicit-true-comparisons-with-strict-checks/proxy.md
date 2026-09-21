# Proxy Plan: PhotoSubmitRequestHandlerTest.php: replace `!`/implicit true comparisons with strict checks

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Replace implicit boolean comparisons in `removeDirRecursive()`

In `proxy/extension_tests/PhotoSubmitRequestHandlerTest.php`, update the private `removeDirRecursive()` test helper to satisfy Codacy's PHPCS `Squiz.Operators.ComparisonOperatorUsage` (ErrorProne) sniff, following the exact pattern already used in #283–#286 (e.g. `proxy/extension/PhotoPathGuard.php`, `proxy/extension/PhotoSubmitRequestHandler.php`):

- Line 168: `if (!is_dir($dir)) {` → `if (is_dir($dir) === FALSE) {`
- Line 178: `if ($file->isFile() || $file->isLink()) {` → `if ($file->isFile() === TRUE || $file->isLink() === TRUE) {`

No other behavior changes — this is a comparison-style-only fix within an existing test helper.

## Files to Change

- `proxy/extension_tests/PhotoSubmitRequestHandlerTest.php` — replace the negation on line 168 and the implicit-true `||` condition on line 178 with explicit strict comparisons.

## CI Checks

- `proxy/`: `docker compose run --rm extension_tests` (CI job: `proxy-tests`)

## Notes

- Purely a static-analysis/style fix in a test file; no assertions or test behavior change, so no new test coverage is needed.
