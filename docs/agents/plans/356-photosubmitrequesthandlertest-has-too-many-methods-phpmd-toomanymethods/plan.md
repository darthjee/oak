# Plan: PhotoSubmitRequestHandlerTest has too many methods (PHPMD TooManyMethods)

Issue: [356-photosubmitrequesthandlertest-has-too-many-methods-phpmd-toomanymethods.md](../../issues/356-photosubmitrequesthandlertest-has-too-many-methods-phpmd-toomanymethods.md)

## Overview
Split `PhotoSubmitRequestHandlerTest` (17 methods) into two handler test classes that share an abstract base class. Drop the two resize cases that `PhotoImageResizerTest` already covers. Add unit tests for `PhotoVersionStorer` and `PhotoSubmitBackendGateway`, which #355 extracted. This is test-only work under `proxy/extension_tests/`.

See [proxy.md](proxy.md) for the full plan.
