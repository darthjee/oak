# Issue: Remove Tarquinn

## Description

The Ruby source code currently uses the `Tarquinn` gem (see `docs/agents/tarquinn-usage.md`) which is integrated with Rails to force HTTP redirections. For example, `/categories` redirects to `/#/categories`. This behavior is configured via `OnePageApplication` in `source/app/controllers/concerns/one_page_application.rb` (lines 10–12).

## Problem

- The `Tarquinn` gem is still being used in the Rails project to manage redirections, adding unnecessary dependency.
- The redirections are now handled by the `tent` proxy, configured in `docker_volumes/proxy_configuration/rules/redirects.php`, making the gem redundant.

## Expected Behavior

- All HTTP redirections are managed exclusively by the `tent` proxy configuration.
- The `Tarquinn` gem and its associated Rails integration are removed from the source project.

## Solution

- Remove the `Tarquinn` gem from the Rails project (`source/`).
- Remove or simplify `OnePageApplication` concern in `source/app/controllers/concerns/one_page_application.rb`.
- The proxy-based redirects in `docker_volumes/proxy_configuration/rules/redirects.php` already cover all previously handled cases.

## Benefits

- Reduces Rails application dependencies.
- Simplifies the codebase by consolidating redirect logic in one place (the proxy).

---
See issue for details: https://github.com/darthjee/oak/issues/198
