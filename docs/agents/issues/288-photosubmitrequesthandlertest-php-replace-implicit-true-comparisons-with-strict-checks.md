# Issue: PhotoSubmitRequestHandlerTest.php: replace `!`/implicit true comparisons with strict checks

## Description
Codacy static analysis (PHPCS `Squiz.Operators.ComparisonOperatorUsage`, category ErrorProne) flags 2 occurrences of implicit boolean comparisons in `proxy/extension_tests/PhotoSubmitRequestHandlerTest.php`, inside the `removeDirRecursive()` test helper.

## Problem
- Line 168: `if (!is_dir($dir)) {` uses the `!` negation operator instead of an explicit strict comparison.
- Line 178: `if ($file->isFile() || $file->isLink()) {` relies on implicit truthiness of the method calls instead of explicit strict comparisons.

This mirrors the pattern already fixed in production code by issues #283–#286 (`PhotoDeleteRequestHandler.php`, `PhotoSubmitRequestHandler.php`, `PhotoPathGuard.php`), applied here to the corresponding test file.

## Expected Behavior
Both conditions use explicit strict boolean comparisons (`=== FALSE` / `=== TRUE`) instead of implicit truthiness checks, consistent with the convention already applied to the non-test files in this series.

## Solution
In `proxy/extension_tests/PhotoSubmitRequestHandlerTest.php`:
- Line 168: `if (!is_dir($dir)) {` → `if (is_dir($dir) === FALSE) {`
- Line 178: `if ($file->isFile() || $file->isLink()) {` → `if ($file->isFile() === TRUE || $file->isLink() === TRUE) {`

## Benefits
- Resolves the Codacy ErrorProne findings for this file.
- Keeps the test file consistent with the strict-comparison convention already applied across the codebase in issues #283–#286.
