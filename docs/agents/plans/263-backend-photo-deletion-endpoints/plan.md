# Plan: Backend — photo deletion endpoints

Issue: [263-backend-photo-deletion-endpoints.md](../../issues/263-backend-photo-deletion-endpoints.md)

## Overview

Add two backend endpoints to `Items::PhotosController` — a `POST
.../photos/:id/deletable.json` pre-delete check and a `DELETE
.../photos/:id.json` row removal — mirroring the existing Submit/status-gate
conventions (`gate_uploading`/`finalize`) and majora's `deletable.json` →
`DELETE` shape. Both are proxy-only endpoints (issue #262 calls them; the
frontend never calls them directly).

See [backend.md](backend.md) for the full plan.
