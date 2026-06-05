# Plan: Add Logoff Action on New Frontend

## Overview

Wire the logoff link in the new React frontend to actually send a `DELETE /users/logoff` request and refresh the header state. Most of the frontend code already exists — the main gap is that the backend `logoff` action has no JSON response, causing a template-missing error when called with `.json`.

## Context

- The logoff link in `HeaderHelper.jsx` is rendered when the user is logged in and calls `handlers.onLogoff`.
- `Header.jsx` passes `controller.handleLogoff` as the handler.
- `HeaderController.handleLogoff` calls `client.logoff()` then `reload()`.
- `HeaderClient.logoff()` sends `DELETE /users/logoff.json`.
- The backend route `delete '/logoff' => 'login#logoff'` exists and CSRF is already exempted.
- `LoginController#logoff` calls `destroy_session` (expires session, deletes cookie) but does **not** render anything for JSON — Rails raises a missing-template error.

## Implementation Steps

### Step 1 — Add JSON response to backend `logoff` action

In `LoginController#logoff`, add a `head :ok` response so that the action properly responds to JSON format requests without rendering a template.

```ruby
def logoff
  destroy_session
  head :ok
end
```

### Step 2 — Add backend spec for JSON logoff response

In `spec/controllers/login_controller_spec.rb`, add a test under `describe 'DELETE logoff'` that verifies the action returns HTTP 200 when called as JSON.

## Files to Change

- `source/app/controllers/login_controller.rb` — add `head :ok` to `logoff` action
- `source/spec/controllers/login_controller_spec.rb` — add JSON response spec for logoff

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `source/`: `cd source && bundle exec rspec` (CircleCI job: `test`)
- `source/`: `cd source && bundle exec rubocop` (CircleCI job: `checks`)

## Notes

- The frontend code (`HeaderClient`, `HeaderController`, `Header`, `HeaderHelper`) is already fully implemented with tests — no frontend changes are needed.
- `protect_from_forgery except: %i[create logoff]` is already in place, so CSRF is not an issue.
- `handleLogoff` in `HeaderController` does not check `response.ok` before calling `reload()` — this is acceptable because even a 500 response from a network-level success will not throw, and the session IS expired server-side before the missing-template error occurs. After the fix, the server returns 200 and the behavior is clean.
