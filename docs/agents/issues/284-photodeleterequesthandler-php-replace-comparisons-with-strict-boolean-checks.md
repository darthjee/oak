# Issue: PhotoDeleteRequestHandler.php: replace `!` comparisons with strict boolean checks

## Description
Codacy static analysis (PHPCS `Squiz.Operators.ComparisonOperatorUsage`, category ErrorProne) flags 5 uses of the prohibited `!` operator in `proxy/extension/PhotoDeleteRequestHandler.php`. House style requires an explicit `=== FALSE` comparison instead of the `!` negation operator.

## Problem
The following 5 conditions use `!` instead of an explicit `=== FALSE` comparison:

- line 106: `if (!$deletableResponse->isSuccessful()) {`
- line 120: `if (!$deleteResponse->isSuccessful()) {`
- line 235: `if (!is_array($decoded) || !isset($decoded['file_path']) || !is_string($decoded['file_path'])) {`
- line 257: `if (!is_dir($destinationDir)) {`
- line 279: `if (!file_exists($safeDestination)) {`

## Solution
Rewrite each condition to compare explicitly against `FALSE` instead of negating with `!`, with no change in behavior:

- line 106: `if ($deletableResponse->isSuccessful() === FALSE) {`
- line 120: `if ($deleteResponse->isSuccessful() === FALSE) {`
- line 235: `if (is_array($decoded) === FALSE || isset($decoded['file_path']) === FALSE || is_string($decoded['file_path']) === FALSE) {`
- line 257: `if (is_dir($destinationDir) === FALSE) {`
- line 279: `if (file_exists($safeDestination) === FALSE) {`

## Benefits
Clears the Codacy `Squiz.Operators.ComparisonOperatorUsage` (ErrorProne) findings and brings the file in line with the project's house style for boolean checks.
