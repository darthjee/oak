# Plan: Missing end comment for long condition in dev proxy frontend.php rule (PHPCS LongConditionClosingComment)

Issue: [363-missing-end-comment-for-long-condition-in-dev-proxy-frontend-php-rule-phpcs-longconditionclosingcomment.md](../../issues/363-missing-end-comment-for-long-condition-in-dev-proxy-frontend-php-rule-phpcs-longconditionclosingcomment.md)

## Overview
Refactor `docker_volumes/proxy_configuration/rules/frontend.php` so the `FRONTEND_DEV_MODE` conditional is short (clearing the PHPCS Squiz LongConditionClosingComment finding), and remove its unused imports. No behavior change.

See [proxy.md](proxy.md) for the full plan.
