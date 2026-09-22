# Plan: Commit the current production proxy configuration with a server-only locals.php

Issue: [339-commit-the-current-production-proxy-configuration-with-a-server-only-locals-php.md](../../issues/339-commit-the-current-production-proxy-configuration-with-a-server-only-locals-php.md)

## Overview
Version the current prod Tent config (frontend, backend, redirects) in `proxy/prod_configuration/`, with host values in a server-only, gitignored `locals.php`. Add a PHPUnit test for the prod rules and change `upload_proxy_files` so it uploads the committed config and carries only `locals.php` forward. This is a prerequisite for #330.

See [proxy.md](proxy.md) for the full plan.
