# Issue: PhotoDeleteRequestHandlerTest.php: replace `!`/implicit true comparisons with strict checks

## Problem
Codacy (PHPCS `Squiz.Operators.ComparisonOperatorUsage`, category ErrorProne) flags 2 occurrences of implicit boolean comparisons in `proxy/extension_tests/PhotoDeleteRequestHandlerTest.php`:

- line 181: `if (!is_dir($dir)) {` — implicit false comparison, should use `=== false`
- line 200: `if ($file->isFile() || $file->isLink()) {` — implicit true comparison, should use `=== true`

## Solution
Replace the implicit comparisons with strict checks:

- `if (!is_dir($dir))` → `if (is_dir($dir) === false)`
- `if ($file->isFile() || $file->isLink())` → `if ($file->isFile() === true || $file->isLink() === true)`

This follows the same pattern already applied in #282–#285 for sibling files in `proxy/extension_tests/` and `proxy/extension_lib/`.
