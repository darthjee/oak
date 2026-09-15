# Plan: Backend — Init/Finalize endpoints for photo upload

Issue: [247-backend-init-finalize-endpoints-for-photo-upload.md](../issues/247-backend-init-finalize-endpoints-for-photo-upload.md)

## Overview

Implement the backend Init (`POST .../photos.json`) and shared status-gate/Finalize (`PATCH .../photos/:id.json`) endpoints for `Oak::Photo`, entirely within `source/` — routes, a new `Items::PhotosController`, the `ready` column (both migration steps), ownership/duplicate guards, and `ready` filtering on every display path.

See [backend.md](backend.md) for the full plan.
