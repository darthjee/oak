# Plan: PhotoDeleteRequestHandlerTest has too many methods (PHPMD TooManyMethods)

Issue: [357-photodeleterequesthandlertest-has-too-many-methods-phpmd-toomanymethods.md](../../issues/357-photodeleterequesthandlertest-has-too-many-methods-phpmd-toomanymethods.md)

## Overview
Test-only refactor in `proxy/extension_tests/`: move the delete-handler fixtures into shared helpers, add unit tests for `PhotoFileDeleter` and `PhotoDeleteBackendGateway`, and slim `PhotoDeleteRequestHandlerTest` down to its orchestration cases so it drops under PHPMD's 10-method limit.

See [proxy.md](proxy.md) for the full plan.
