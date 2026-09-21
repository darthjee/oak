# Plan: PhotoDeleteRequestHandler and its test have too many methods

Issue: [292-photodeleterequesthandler-and-its-test-have-too-many-methods.md](../issues/292-photodeleterequesthandler-and-its-test-have-too-many-methods.md)

## Overview
Split responsibilities out of `PhotoDeleteRequestHandler` and its test, and remove the duplication those methods share with `PhotoSubmitRequestHandler`/`PhotoSubmitRequestHandlerTest`, bringing both flagged classes back under PHPMD's `TooManyMethods` threshold.

See [proxy.md](proxy.md) for the full plan.
