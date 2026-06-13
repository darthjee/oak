# Plan: Remove Tarquinn

## Overview

Replace the `Tarquinn` gem's declarative redirection DSL with native Rails `before_action`
calls in the two concerns that use it (`OnePageApplication` and `UserRequired`), then remove
the gem from the project.

## Context

`Tarquinn` registers a single `before_action :perform_redirection` that evaluates all
`redirection_rule` / `skip_redirection_rule` declarations in definition order. The proxy
(`tent`) now handles the SPA redirections for bare GET paths, but the Rails layer still
enforces them — and still uses Tarquinn to do so. Removing the gem requires replicating the
existing logic with plain Rails `before_action` before deleting the dependency.

The two rules currently in play are:

| Concern | Rule | Fires when | Skipped when |
|---|---|---|---|
| `OnePageApplication` | `render_root` | `perform_angular_redirect?` | `ajax? \|\| home?` |
| `UserRequired` | `render_forbidden` | `missing_user?` | — |
| `UserRequired` | _(skip render_root)_ | — | `missing_user?` |

## Implementation Steps

### Step 1 — Replace Tarquinn in `OnePageApplication`

File: `source/app/controllers/concerns/one_page_application.rb`

- Remove `include Tarquinn`.
- Remove the two Tarquinn DSL lines (`redirection_rule` / `skip_redirection_rule`).
- Add `before_action :maybe_redirect_to_spa` inside the `included` block.
- Add a private method `maybe_redirect_to_spa` that:
  - Returns early if `spa_redirect_skipped?`
  - Calls `redirect_to render_root` if `perform_angular_redirect?`
- Add a private method `spa_redirect_skipped?` returning `ajax? || home?` — extracted so
  `UserRequired` can override it.

### Step 2 — Replace Tarquinn in `UserRequired`

File: `source/app/controllers/concerns/user_required.rb`

- Remove the two Tarquinn DSL lines (`redirection_rule` / `skip_redirection_rule`).
- Add `before_action :redirect_if_unauthorized` inside the `included` block.
- Add a private method `redirect_if_unauthorized` that calls
  `redirect_to render_forbidden if missing_user?`.
- Override `spa_redirect_skipped?` to return `super || missing_user?`, so the SPA redirect
  is also suppressed when the user is missing (and the forbidden redirect takes over instead).

### Step 3 — Add spec for `UserRequired`

File: `source/spec/controllers/concerns/user_required_spec.rb` _(new)_

- Test that an unauthenticated request to a protected action redirects to `/#/forbidden`.
- Test that the SPA redirect is suppressed when the user is missing (no double-redirect).
- Test that an authenticated request to a protected action does not redirect to forbidden.

### Step 4 — Remove the `tarquinn` gem

- Remove the `gem 'tarquinn'` line from `source/Gemfile`.
- Run `bundle install` inside the container to update `Gemfile.lock`.

### Step 5 — Update documentation

- Remove the **Tarquinn Usage** section from `AGENTS.md`.
- Delete `docs/agents/tarquinn-usage.md`.

## Files to Change

- `source/app/controllers/concerns/one_page_application.rb` — remove Tarquinn, add before_action
- `source/app/controllers/concerns/user_required.rb` — remove Tarquinn DSL, add before_action + override
- `source/spec/controllers/concerns/one_page_application_spec.rb` — existing tests should pass unchanged
- `source/spec/controllers/concerns/user_required_spec.rb` — new spec file
- `source/Gemfile` — remove `gem 'tarquinn'`
- `source/Gemfile.lock` — updated by `bundle install`
- `AGENTS.md` — remove Tarquinn section and `redirection_rule` / `skip_redirection_rule` usage from Controller Patterns
- `docs/agents/architecture.md` — remove Tarquinn from line ~41 (redirect logic description) and from the Key Gems table
- `docs/agents/tarquinn-usage.md` — delete

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `source/`: `cd source && bundle exec rspec` (CircleCI job: RSpec)
- `source/`: `rubocop` (CircleCI job: Rubocop)

## Notes

- The existing `one_page_application_spec.rb` tests behaviour (redirects or not) — they do
  not reference the Tarquinn DSL directly, so they should pass unchanged after the refactor.
- The `UserRequired` concern currently has no spec; one must be added (Step 3).
- `before_action` hooks run in registration order. `OnePageApplication` registers
  `maybe_redirect_to_spa` first; `UserRequired` registers `redirect_if_unauthorized` after.
  The `spa_redirect_skipped?` override ensures the SPA rule is suppressed before the
  forbidden rule fires — preserving the original Tarquinn evaluation order.
