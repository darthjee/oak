# Plan: Backend: kind edit/update support

Issue: [273-backend-kind-edit-update-support.md](../issues/273-backend-kind-edit-update-support.md)

## Overview
Add `edit`/`update` routes and controller wiring for `Oak::Kind`, bringing it to parity with `Oak::Category`'s existing edit/update support. `Oak::Kind` has a single `name` attribute (slug derived via `Slugable`), so no new builder or decorator is needed — the existing `kind_params` and `Oak::Kind::Decorator` are reused unchanged.

See [backend.md](backend.md) for the full plan.
