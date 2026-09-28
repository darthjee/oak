# Plan: Frontend — photo migration page with request loop

Issue: [382-frontend-photo-migration-page-with-request-loop.md](../../issues/382-frontend-photo-migration-page-with-request-loop.md)

## Overview
Add a logged-in-only `#/photos/migration` page. On **Start**, it calls the proxy's `POST /migrations/photos?limit=20` in a loop until the stop conditions in the issue are met, accumulating totals and listing missing/failed photos. The work is frontend-only: a new client, a new page (component + controller + helper), route registration, and a header link.

See [frontend.md](frontend.md) for the full plan.
