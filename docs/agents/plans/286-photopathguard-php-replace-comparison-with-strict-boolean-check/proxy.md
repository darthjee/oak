# Proxy Plan: PhotoPathGuard.php: replace `!` comparison with strict boolean check

Main plan: [plan.md](plan.md)

## Overview

`PhotoPathGuard::resolve()` (`proxy/extension/PhotoPathGuard.php:44`) uses `!$this->isContained($realDir, $realRoot)` to detect a failed containment check. Codacy's `Squiz.Operators.ComparisonOperatorUsage` (ErrorProne) flags this — house style, already enforced in #282/#283/#284, requires `=== FALSE` instead of the `!` operator.

## Context

`isContained()` is a private helper that returns a real `bool`. It is the only `!` comparison in the file — the rest of `resolve()` already uses `=== false`/`!== false` style comparisons (`$realDir === false || $realRoot === false`). No other files under `proxy/extension/` are affected by this issue.

## Implementation Steps

### Step 1 — Replace the `!` comparison

In `proxy/extension/PhotoPathGuard.php:44`, change:

```php
if (!$this->isContained($realDir, $realRoot)) {
```

to:

```php
if ($this->isContained($realDir, $realRoot) === FALSE) {
```

This is a behavior-preserving style fix — `isContained()`'s return type is unchanged, so `=== FALSE` and `!` are equivalent here.

## Files to Change

- `proxy/extension/PhotoPathGuard.php` — replace the `!` comparison at line 44 with `=== FALSE`.

## CI Checks

- `proxy`: `vendor/bin/phpunit` (run inside the `darthjee/tent-test` Docker image per `.circleci/config.yml`; CI job: `proxy-tests`)

## Notes

- No test file exists for `PhotoPathGuard` under `proxy/extension_tests/`; none is added here since this is a pure style fix with no behavior change.
