# Plan: Proxy — /migrations/photos handler moving legacy files

Issue: [381-proxy-migrations-photos-handler-moving-legacy-files.md](../../issues/381-proxy-migrations-photos-handler-moving-legacy-files.md)

## Overview

Add a Tent rule `POST /migrations/photos?limit=N` backed by a new custom `PhotoMigrationRequestHandler`. The handler claims a batch from the backend (`prepare`, #380), renames each photo's legacy `photos/` and `snaps/` files to their new names, reports the result back to the backend (`PATCH`), and returns a JSON summary. This work is entirely inside the proxy agent's scope.

See [proxy.md](proxy.md) for the full plan.
