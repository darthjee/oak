# Plan: PhotoSubmitRequestHandler.php: replace `!`/implicit true comparisons with strict checks

Issue: [285-photosubmitrequesthandler-php-replace-implicit-true-comparisons-with-strict-checks.md](../../issues/285-photosubmitrequesthandler-php-replace-implicit-true-comparisons-with-strict-checks.md)

## Overview
Codacy flags 8 `!`/implicit-true boolean checks in `proxy/extension/PhotoSubmitRequestHandler.php`. Rewrite them to explicit `=== FALSE` / `=== TRUE` comparisons, mirroring the convention already applied to the sibling `PhotoDeleteRequestHandler.php` in issue #284 (PR #296). No behavior change.

See [proxy.md](proxy.md) for the full plan.
