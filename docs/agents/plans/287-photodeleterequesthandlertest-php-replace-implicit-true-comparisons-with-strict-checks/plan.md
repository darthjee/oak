# Plan: PhotoDeleteRequestHandlerTest.php: replace `!`/implicit true comparisons with strict checks

Issue: [287-photodeleterequesthandlertest-php-replace-implicit-true-comparisons-with-strict-checks.md](../../issues/287-photodeleterequesthandlertest-php-replace-implicit-true-comparisons-with-strict-checks.md)

## Overview
Replace two implicit boolean comparisons in `proxy/extension_tests/PhotoDeleteRequestHandlerTest.php` with strict `=== true`/`=== false` checks, resolving the Codacy PHPCS `Squiz.Operators.ComparisonOperatorUsage` findings, following the same mechanical pattern already applied in #282–#285.

See [proxy.md](proxy.md) for the full plan.
