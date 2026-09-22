# Plan: Unused constructor parameters in FakeHttpClient.php (PHPMD UnusedFormalParameter)

Issue: [314-unused-constructor-parameters-in-fakehttpclient-php-phpmd-unusedformalparameter.md](../issues/314-unused-constructor-parameters-in-fakehttpclient-php-phpmd-unusedformalparameter.md)

## Overview

`FakeHttpClient::request()` accepts `$uploadedFiles` and `$postFields` (mandated by `Tent\Http\HttpClientInterface`) but never uses them, which PHPMD flags as `UnusedFormalParameter`. Fix it by recording both into `$this->calls`, and add direct test coverage proving they're captured.

See [proxy.md](proxy.md) for the full plan.
