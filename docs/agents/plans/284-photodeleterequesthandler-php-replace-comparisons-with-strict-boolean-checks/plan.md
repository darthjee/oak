# Plan: PhotoDeleteRequestHandler.php: replace `!` comparisons with strict boolean checks

Issue: [284-photodeleterequesthandler-php-replace-comparisons-with-strict-boolean-checks.md](../../issues/284-photodeleterequesthandler-php-replace-comparisons-with-strict-boolean-checks.md)

## Overview
Rewrite the 5 `!`-negated conditions in `proxy/extension/PhotoDeleteRequestHandler.php` flagged by Codacy (PHPCS `Squiz.Operators.ComparisonOperatorUsage`) as explicit `=== FALSE` comparisons, per house style. No behavior change.

See [proxy.md](proxy.md) for the full plan.
