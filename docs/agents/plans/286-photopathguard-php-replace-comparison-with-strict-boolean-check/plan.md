# Plan: PhotoPathGuard.php: replace `!` comparison with strict boolean check

Issue: [286-photopathguard-php-replace-comparison-with-strict-boolean-check.md](../../issues/286-photopathguard-php-replace-comparison-with-strict-boolean-check.md)

## Overview

Replace the single `!` comparison in `proxy/extension/PhotoPathGuard.php` with a strict `=== FALSE` check, clearing the Codacy `Squiz.Operators.ComparisonOperatorUsage` finding and matching the house style already applied in #282/#283/#284.

See [proxy.md](proxy.md) for the full plan.
