# Plan: PhotoSubmitRequestHandler::processsRequest exceeds complexity thresholds

Issue: [291-photosubmitrequesthandler-processsrequest-exceeds-complexity-thresholds.md](../../issues/291-photosubmitrequesthandler-processsrequest-exceeds-complexity-thresholds.md)

## Overview
Extract the inlined validation/upload steps out of `PhotoSubmitRequestHandler::processsRequest` into smaller private helper methods, so the method clears Lizard/PHPMD's cyclomatic- and NPath-complexity thresholds without changing any external behavior.

See [proxy.md](proxy.md) for the full plan.
