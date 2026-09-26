# Plan: Backend — photo migration state and prepare/confirm endpoints

Issue: [380-backend-photo-migration-state-and-prepare-confirm-endpoints.md](../../issues/380-backend-photo-migration-state-and-prepare-confirm-endpoints.md)

## Overview

Add per-photo migration state to `Oak::Photo` and two endpoints under `/user/photos/migration`. The proxy uses them to atomically claim batches of legacy photos (with backend-generated UUID target names) and to confirm which ones it moved or found missing. All work is backend-only.

See [backend.md](backend.md) for the full plan.
