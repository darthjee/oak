# AuthorizationsHelper
Create a static helper, like `KindsHelper`, rendering:

- `renderLoading()` → `LoadingMessage`.
- Page layout: heading, warning text (only approve requests you started yourself), **Refresh**
  button, page-level `ErrorContainer` when there is a load error (Refresh still shown), a
  "no pending requests" message for an empty list, otherwise one row per request.
- Row: IP (`requestIp`), User-Agent (`requestUserAgent`), age from `createdAt` ("just now" under a
  minute, "N min ago", hours for older), expiry from `expiresAt` ("Expires in N min", "Expired"
  when past), "Keep signed in" badge only when `keepSignedIn === true`, **Deny** and **Authorize**
  buttons; when the row form is open, a password input and **Confirm** button; the row error when
  present.
- Handlers (refresh, deny, open authorize, password change, confirm) are passed in from the page.
- Put age/expiry formatting in small pure functions that take a `now` argument, so they are
  testable.

Specs cover: loading, empty, page error with Refresh, row fields, badge presence/absence, age and
expiry wording at the boundaries, open form, row error.

## Files to Change
- `frontend/assets/js/components/pages/helpers/AuthorizationsHelper.jsx` — new helper.
- `frontend/spec/components/pages/helpers/AuthorizationsHelper_spec.js` — new specs.
