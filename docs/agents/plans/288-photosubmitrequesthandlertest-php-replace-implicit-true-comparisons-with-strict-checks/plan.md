# Plan: PhotoSubmitRequestHandlerTest.php: replace `!`/implicit true comparisons with strict checks

Issue: [288-photosubmitrequesthandlertest-php-replace-implicit-true-comparisons-with-strict-checks.md](../../issues/288-photosubmitrequesthandlertest-php-replace-implicit-true-comparisons-with-strict-checks.md)

## Overview

Replace the two implicit-boolean comparisons Codacy flags in `proxy/extension_tests/PhotoSubmitRequestHandlerTest.php`'s `removeDirRecursive()` helper with explicit strict comparisons, matching the convention already applied to production code by issues #283–#286.

See [proxy.md](proxy.md) for the full plan.
