# Issue: PhotoSubmitRequestHandler.php: replace `!`/implicit true comparisons with strict checks

## Description
Codacy (PHPCS `Squiz.Operators.ComparisonOperatorUsage`, category ErrorProne) flags 8 uses of the prohibited `!` operator / implicit true comparison in `proxy/extension/PhotoSubmitRequestHandler.php`. House style requires explicit `=== FALSE` / `=== TRUE` checks instead, as already established by the sibling fix in `PhotoDeleteRequestHandler.php` (issue #284, PR #296).

## Problem
The following 8 locations in `proxy/extension/PhotoSubmitRequestHandler.php` use `!` negation or implicit boolean comparison rather than explicit strict checks:

- line 122: `if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {`
- line 126: `if (!$this->hasAllowedExtension($file['name'] ?? '')) {`
- line 139: `if (!$gateResponse->isSuccessful()) {`
- line 149: `if (!$this->writeFile($file['tmp_name'], $filePath)) {`
- line 155: `if (!$finalizeResponse->isSuccessful()) {`
- line 270: `if (!is_array($decoded) || !isset($decoded['file_path']) || !is_string($decoded['file_path'])) {`
- line 294: `if (!is_dir($dir)) {`
- line 304: `if (is_uploaded_file($tmpName)) {` — implicit true comparison, needs `=== TRUE`

_Found via Codacy static analysis._

## Solution
Rewrite each flagged condition to the explicit `=== FALSE` / `=== TRUE` form, following the exact convention already applied in `PhotoDeleteRequestHandler.php` (issue #284, PR #296):

- A single-condition `!expr` becomes `expr === FALSE`.
- A multi-condition `||` chain of negated calls (line 270) is reformatted as a multi-line `if (...)` block with one `=== FALSE` condition per line, matching the style used for the equivalent chain in `PhotoDeleteRequestHandler.php`.
- The mixed condition on line 122 (`!$file || (...) !== UPLOAD_ERR_OK`) keeps its existing `!==` comparison (already strict) and only converts the leading `!$file` to `$file === FALSE`.
- Line 304's implicit true check becomes `is_uploaded_file($tmpName) === TRUE`.

No behavioral change — only the comparison style changes, matching house style enforced by the Codacy `Squiz.Operators.ComparisonOperatorUsage` rule.

## Benefits
- Clears the 8 Codacy `ErrorProne` findings in this file.
- Keeps `PhotoSubmitRequestHandler.php` consistent with the strict-comparison style already applied to its sibling `PhotoDeleteRequestHandler.php`.
