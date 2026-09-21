# Proxy Plan: PhotoDeleteRequestHandlerTest.php: replace `!`/implicit true comparisons with strict checks

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Replace the implicit `false` comparison in `writeExistingFile`
In `proxy/extension_tests/PhotoDeleteRequestHandlerTest.php`, line 181 reads `if (!is_dir($dir)) {`. Replace it with `if (is_dir($dir) === false) {` so the PHPCS `Squiz.Operators.ComparisonOperatorUsage` rule sees an explicit comparison instead of an implicit boolean negation.

### Step 2 — Replace the implicit `true` comparison in `removeDirRecursive`
In the same file, line 200 reads `if ($file->isFile() || $file->isLink()) {`. Replace it with `if ($file->isFile() === true || $file->isLink() === true) {`, applying the strict check to each boolean-returning call individually.

## Files to Change
- `proxy/extension_tests/PhotoDeleteRequestHandlerTest.php` — replace the two implicit comparisons flagged by Codacy (lines 181 and 200) with strict `=== false`/`=== true` checks; no behavior change, test logic and assertions stay identical.

## CI Checks
- `proxy`: `docker compose run --rm extension_tests` (CI job: `proxy-tests`)

## Notes
- Purely mechanical style fix — no functional change expected. The other `if (!is_dir($dir))` occurrence at line 190 (inside `removeDirRecursive`) is not flagged by Codacy and is out of scope for this issue.
