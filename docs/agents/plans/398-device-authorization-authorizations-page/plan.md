# Plan: Device authorization: Authorizations page

Issue: [398-device-authorization-authorizations-page.md](../../issues/398-device-authorization-authorizations-page.md)

## Overview
Replace the placeholder Authorizations page with the real approver page: extend
`AuthorizationRequestsClient` with `mine`/`authorize`/`deny`, and build the page as a component +
controller + helper following the existing page pattern. Frontend-only.

See [frontend.md](frontend.md) for the full plan.
