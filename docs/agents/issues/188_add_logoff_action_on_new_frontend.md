# Issue: Add Logoff Action on New Frontend

## Description

The new frontend's header displays a logoff link when the user is logged in, but it is not yet functional. The logoff action needs to send a `DELETE /users/logoff` request and then trigger a refresh of the views.

## Problem

- The logoff link in the new frontend (`frontend/assets/js/components/elements/helpers/HeaderHelper.jsx#L117-L119`) is visible but does not perform any action.
- The old frontend handles logoff via `source/app/views/layouts/_header.html.erb#L39`, but this behavior has not been ported to the new React-based frontend.

## Expected Behavior

- Clicking the logoff link sends a `DELETE /users/logoff` request to the server.
- After a successful response, the views are refreshed to reflect the logged-out state.

## Solution

- Implement the logoff handler in `HeaderHelper.jsx` (around line 117–119) to issue a `DELETE` request to `/users/logoff`.
- After the request completes successfully, trigger a view refresh (e.g., redirect to home or reload the app state).

## Benefits

- Users of the new frontend can properly log out, matching the behavior of the old frontend.
- Ensures session security by allowing users to terminate their session.

---
See issue for details: https://github.com/darthjee/oak/issues/188
