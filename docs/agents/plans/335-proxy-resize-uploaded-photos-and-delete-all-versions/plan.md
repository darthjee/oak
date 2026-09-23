# Plan: Proxy: resize uploaded photos and delete all versions

Issue: [335-proxy-resize-uploaded-photos-and-delete-all-versions.md](../../issues/335-proxy-resize-uploaded-photos-and-delete-all-versions.md)

## Overview
The proxy's photo submit handler makes GD-resized `photos/` (max 800x1064) and `snaps/` (max 215x215) versions next to the `origin/` original, and the delete handler removes all three. Both handlers take a `storageRoot` option instead of `photosPath`. All the work is in the proxy agent's scope.

See [proxy.md](proxy.md) for the full plan.
