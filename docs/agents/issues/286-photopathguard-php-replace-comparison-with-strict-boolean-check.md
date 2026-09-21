# Issue: PhotoPathGuard.php: replace `!` comparison with strict boolean check

## Description

Codacy (PHPCS `Squiz.Operators.ComparisonOperatorUsage`, category ErrorProne) flags `proxy/extension/PhotoPathGuard.php:44`:

```php
if (!$this->isContained($realDir, $realRoot)) {
```

House style, already enforced in #282/#283/#284, requires `=== FALSE` instead of the `!` operator for boolean checks.

## Problem

`PhotoPathGuard::resolve()` uses `!$this->isContained($realDir, $realRoot)` to detect a failed containment check. This is the only `!` comparison in the file. It violates the house style already applied across the proxy codebase (PhotoDeleteRequestHandler.php in #284, category item controllers in #283, Route.js in #282) and trips the Codacy `Squiz.Operators.ComparisonOperatorUsage` check.

## Solution

In `proxy/extension/PhotoPathGuard.php:44`, replace:

```php
if (!$this->isContained($realDir, $realRoot)) {
```

with:

```php
if ($this->isContained($realDir, $realRoot) === FALSE) {
```

matching the pattern already applied to `PhotoDeleteRequestHandler.php` in #284. No other `!` comparisons exist in this file.

## Benefits

Clears the Codacy `ErrorProne` finding and keeps `PhotoPathGuard.php` consistent with the strict-boolean-check house style already established across the proxy extension codebase.
