# Plan: Frontend — photo delete UI/client

Issue: [265-frontend-photo-delete-ui-client.md](../../issues/265-frontend-photo-delete-ui-client.md)

## Overview

Add the frontend delete action for category item photos: a `delete()` method
on `PhotoUploadClient.js`, a confirm-gated delete button on
`PhotoCarouselItem`, and the state wiring on both the item details page and
the item edit page to call it and refresh the photo list afterward.

See [frontend.md](frontend.md) for the full plan.
