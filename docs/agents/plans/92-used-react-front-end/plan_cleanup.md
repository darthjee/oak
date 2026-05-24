# Cleanup Plan: Remove AngularJS from Rails

Step 8 of [plan.md](plan.md). Remove the AngularJS frontend code from the Rails app once the React frontend is validated in production. Do NOT start this step until Step 6 is fully live.

---

## What to Remove

### `source/app/assets/`

Remove all AngularJS and Cyberhawk JavaScript assets:
- AngularJS library files
- Cyberhawk library files
- Any custom JS that was part of the SPA (controllers, services, directives)

Keep any CSS/images that might still be referenced (audit before deleting).

### `source/app/views/`

Remove ERB templates that were only used as `?ajax=true` fragments served to AngularJS. These are the per-resource `index`, `show`, `new`, `edit`, and `_form` partials.

Keep:
- The root layout (`layouts/application.html.erb`) if it is still used for anything
- Any views that are not purely AngularJS-driven (e.g., error pages, admin pages)

### `source/app/controllers/concerns/one_page_application.rb`

Remove the `OnePageApplication` concern entirely. It implements the SPA redirect logic (`GET /path` → `#/path`) which is no longer needed since React Router handles navigation client-side.

Remove `include OnePageApplication` from all controllers that include it.

### `source/config/routes.rb`

Remove HTML routes that are no longer served by Rails. Keep only:
- JSON API routes (`.json` format or `:format` routes)
- Any non-SPA routes (e.g., authentication, admin, webhooks)

### `source/spec/`

Remove controller specs that test the `?ajax=true` HTML rendering behaviour. Keep specs for JSON responses.

---

## What to Keep

- All controllers (they still serve the JSON API)
- All models, decorators, builders
- All JSON routes
- RuboCop / RSpec setup

---

## Checklist

- [ ] React frontend validated in production
- [ ] All AngularJS JS assets removed from `source/app/assets/`
- [ ] `OnePageApplication` concern removed and all `include` calls cleaned up
- [ ] ERB templates for SPA views removed
- [ ] Routes file updated to remove HTML-only routes
- [ ] Controller specs for HTML rendering removed
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes
