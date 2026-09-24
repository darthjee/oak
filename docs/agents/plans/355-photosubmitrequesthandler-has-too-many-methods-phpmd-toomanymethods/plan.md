# Plan: PhotoSubmitRequestHandler has too many methods (PHPMD TooManyMethods)

Issue: [355-photosubmitrequesthandler-has-too-many-methods-phpmd-toomanymethods.md](../../issues/355-photosubmitrequesthandler-has-too-many-methods-phpmd-toomanymethods.md)

## Overview
Split `PhotoSubmitRequestHandler` (11 methods, PHPMD limit 10) the same way `PhotoDeleteRequestHandler` was split: backend status-gate calls go to a new `PhotoSubmitBackendGateway`, file storage goes to a new `PhotoVersionStorer`, and the handler keeps parsing, validation and orchestration. Behaviour does not change.

See [proxy.md](proxy.md) for the full plan.
