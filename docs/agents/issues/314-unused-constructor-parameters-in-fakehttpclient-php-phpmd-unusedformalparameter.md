# Issue: Unused constructor parameters in FakeHttpClient.php (PHPMD UnusedFormalParameter)

## Problem

Codacy flags two PHP Mess Detector `UnusedFormalParameter` findings (category
UnusedCode, severity Warning) in `proxy/extension_tests/FakeHttpClient.php`:

- Line 31 — `array $uploadedFiles = [],` — https://app.codacy.com/p/681941/issues/index?resultDataId=131540710759
- Line 32 — `array $postFields = []` — https://app.codacy.com/p/681941/issues/index?resultDataId=131540710763

`FakeHttpClient::request()` implements `Tent\Http\HttpClientInterface`, which
declares both parameters as part of its contract, but the fake's method body
only records `method`, `url`, `headers`, and `body` into `$this->calls` —
`$uploadedFiles` and `$postFields` are accepted but never used.

Since the parameters are mandated by `HttpClientInterface`, they cannot be
removed from the signature without breaking the contract — the real
implementation (`Tent\Http\CurlHttpClient`) uses both to build
multipart/form-encoded request bodies. No test currently exercises non-default
values for either parameter, and no assertion reads them back from
`$httpClient->calls`.

## Solution

Record `$uploadedFiles` and `$postFields` into `$this->calls` in
`FakeHttpClient::request()`, mirroring the existing `method`/`url`/`headers`/`body`
entries. This satisfies PHPMD by using both parameters, keeps the
`HttpClientInterface` contract intact, and makes the fake capable of asserting
on uploaded files / post fields.

Add test coverage that exercises non-default values for both parameters
(e.g. through `PhotoSubmitRequestHandlerTest`, or a dedicated
`FakeHttpClient` test) and asserts they were correctly recorded in
`$httpClient->calls`, so the fix is actually verified rather than just
silencing the linter.
