# Issue: PhotoSubmitRequestHandler::processsRequest exceeds complexity thresholds

## Description
Codacy static analysis flags `PhotoSubmitRequestHandler::processsRequest` (`proxy/extension/PhotoSubmitRequestHandler.php:112`) for exceeding complexity thresholds across three metrics.

## Problem
- Lizard `ccn-medium`: cyclomatic complexity 19 (limit 15)
- PHPMD `CyclomaticComplexity`: complexity 11 (threshold 10)
- PHPMD `NPathComplexity`: NPath complexity 576 (threshold 200)

`processsRequest` currently inlines the entire Submit flow in one method: path parsing, upload-presence/error check, extension check, size check, the two backend gate calls (`uploading`/`ready`), extracting `file_path` from the gate response, and writing the file to disk — each with its own early-return branch. That branch count is what drives all three metrics over threshold.

## Expected Behavior
`processsRequest` keeps its exact external behavior — same status codes, same response bodies, same order of checks/early returns — but at a complexity that clears all three thresholds. `PhotoSubmitRequestHandlerTest.php` continues to pass unmodified, since this is a pure refactor with no behavior change.

## Solution
Extract the inlined validation/upload steps into smaller private methods, similar to the existing `callGate`/`writeFile`/`extractFilePath` helpers already on the class. In particular:
- Fold the upload-presence check, extension check, and size check into a single private validation helper that returns either an error `Response` or `null`, collapsing three early-return branches in `processsRequest` into one.
- Keep the gate-call → write → finalize sequence as sequential calls to existing (or newly extracted) private helpers, so `processsRequest` reads as a short, linear list of steps rather than inlined logic.

This mirrors the extract-method cleanups already applied to sibling proxy handlers (e.g. `PhotoDeleteRequestHandler`, `PhotoPathGuard`) in recent issues.

## Benefits
Brings the method under Lizard/PHPMD's complexity thresholds, keeps the proxy extension code consistent with the cleanup pattern already applied elsewhere in this area, and makes each validation/upload step independently readable.
