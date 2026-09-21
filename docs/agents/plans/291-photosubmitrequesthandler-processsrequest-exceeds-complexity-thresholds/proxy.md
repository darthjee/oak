# Proxy Plan: PhotoSubmitRequestHandler::processsRequest exceeds complexity thresholds

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Extract upload validation into a single helper
`processsRequest` currently has three separate early-return branches for validating the uploaded file: presence/upload-error check, extension check, and size check. Collapse these into one new private method, e.g. `validateUpload(?array $file): ?Response`, that runs all three checks and returns the appropriate error `Response` (400/415/413) on the first failure, or `null` when the file is valid. `processsRequest` then calls it once and returns early only if it's non-null — turning three branches into one.

### Step 2 — Streamline the gate → write → finalize sequence
With Step 1 done, `processsRequest` still inlines: building the gate URL, calling the gate with `uploading`, checking success, extracting `file_path`, checking for `null`, writing the file, checking the write result, calling the gate again with `ready`, and checking success. Keep these as sequential calls into existing helpers (`gateUrl`, `callGate`, `extractFilePath`, `writeFile`) exactly as they are today — do not change their signatures or behavior — but confirm (via a quick local Lizard/PHPMD run, or by counting branches by hand) that the reduced branch count from Step 1 alone is enough to clear all three thresholds:
- Lizard `ccn-medium`: cyclomatic complexity ≤ 15
- PHPMD `CyclomaticComplexity`: complexity ≤ 10
- PHPMD `NPathComplexity`: NPath complexity ≤ 200

If Step 1 alone isn't enough, extract a second helper here — e.g. `submitAndFinalize(string $gateUrl, array $file, string $filePath, ?string $cookie): Response` wrapping the write+finalize tail — to shed the remaining branches. Keep `processsRequest` itself as a short, linear list of steps either way.

## Files to Change
- `proxy/extension/PhotoSubmitRequestHandler.php` — extract `validateUpload` (Step 1) and, if needed, a write/finalize helper (Step 2); `processsRequest` shrinks to a linear sequence of calls into these helpers.

## CI Checks
- `proxy/`: `docker run --rm -v "$(pwd)/proxy/extension:/home/app/app/source/extension" -v "$(pwd)/proxy/extension_tests:/home/app/app/source/tests/extension" darthjee/tent-test:0.10.4 vendor/bin/phpunit` (CI job: `proxy-tests`)

## Notes
- This is a pure refactor: `PhotoSubmitRequestHandlerTest.php` must keep passing unmodified, with no new/changed assertions — it's the safety net proving behavior didn't shift.
- Do not rename `processsRequest` (the triple-s spelling is the parent `RequestHandler`'s own method name, also used verbatim by `PhotoDeleteRequestHandler`) — out of scope for this issue.
- Codacy's Lizard/PHPMD thresholds aren't wired into local CI; there's no local command that reproduces them exactly, so treat the branch-count reduction in Step 1 (and Step 2 if needed) as the primary lever, and rely on Codacy's next scan of the PR to confirm the thresholds clear.
