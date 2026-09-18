# Plan: Proxy — photo deletion route and handler

Issue: [264-proxy-photo-deletion-route-and-handler.md](../issues/264-proxy-photo-deletion-route-and-handler.md)

## Overview

Add a proxy-owned `DELETE /uploads/categories/:category_slug/items/:item_id/photos/:id`
route, backed by a new `PhotoDeleteRequestHandler.php`, that calls the
already-merged backend deletion contract (#263) and unlinks the file from
disk. Also retrofits `PhotoSubmitRequestHandler::writeFile()` with the same
path-traversal guard the new delete handler gets, so both handlers share
equal defense-in-depth. This is entirely proxy-owned work — see
[proxy.md](proxy.md) for the full plan.

See [proxy.md](proxy.md) for the full plan.
