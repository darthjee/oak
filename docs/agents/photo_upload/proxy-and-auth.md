# Photo Upload — Proxy & Auth

[← Back to Photo Upload](index.md)

## Tent extension mechanism

Oak's current proxy config (`docker_volumes/proxy_configuration/rules/*.php`)
only uses Tent's built-in handlers (`default_proxy`, `proxy`, `static`) —
none of which can parse `multipart/form-data` and write a file to disk.
Handling the Submit step (see [Contracts](contracts.md)) at all requires
introducing Tent's extension mechanism — a custom `RequestHandler` class
mounted via `proxy/extension/loader.php` — new infrastructure for Oak
either way.

Given that custom handler is being written regardless, having it also make
one outbound PATCH call to the backend's Finalize endpoint right after
writing the file is a small addition, not a separate infrastructure
decision — see the index page's "[Reference flow correction](index.md#reference-flow-correction)"
and "Finalize ownership" reasoning for why the proxy, not the frontend,
owns that transition.

## New `proxy/` folder and agent ownership

This flow introduces a new top-level `proxy/` folder
(`proxy/extension/loader.php`, custom PHP `RequestHandler` classes)
alongside the existing `docker_volumes/proxy_configuration/`. That's a new
root-level folder, so per this repo's agent-roster convention it needs an
explicit owner rather than falling to whichever agent happens to touch it
first.

**Decision: a new `proxy` specialist agent** (spun off as #252,
`.claude/agents/proxy.md`) owns `docker_volumes/proxy_configuration/` and
the new `proxy/` folder — reassigned from `architect`, which #244's
original split had pencilled in before this doc surfaced the
extension-mechanism requirement. #246 is updated accordingly.

## Session-cookie reuse — no bespoke upload token

Reuse Oak's existing session-cookie auth end-to-end. Unlike majora (which
needs its own `X-Upload-Token`/expiration scheme), Oak already has
signed-cookie session auth (`cookies.signed[:session]`, backed by the
`sessions` table) flowing through the Tent proxy today:
`ApplicationController` sets `X-Skip-Cache` based on that cookie, and
`backend.php`'s `default_proxy` rule already consumes it
(`skip_cache_header => 'X-Skip-Cache'`) — proof the `Cookie` header already
reaches the backend unmodified through Tent (nothing in Tent's middlewares
strips it; only `Host` gets rewritten).

Concretely:

- The new custom Submit handler forwards the incoming `Cookie` header on
  its own outbound calls to the backend.
- Backend's Init and Finalize actions apply the same `require_user_for` +
  item-ownership checks `ItemsController` already uses elsewhere
  (`photo.item.user == logged_user`) — no new auth primitive.
- No `token`/`expiration_time` columns are needed on `photos` for auth
  purposes — `ready` is the only new column needed (see
  [Data Model & Migration](data-model-and-migration.md)); a separate
  abandoned-upload cleanup mechanism, if wanted, is an edge case, not an
  auth concern (see [Edge Cases & Coexistence](edge-cases-and-coexistence.md)).

## Pre-write authorization gate

The Submit handler calls the backend *before* writing the uploaded bytes to
disk (cookie forwarded, ownership verified), mirroring the shape of
majora's pre-write "uploading" call — but for Oak this call exists purely
to authorize the write, not to obtain `file_path` (Oak's path is already
deterministic). This prevents the proxy from ever writing
unauthorized/unauthenticated bytes to disk.

## Upload validation

The Submit handler is the only place that sees the raw bytes before they
land on disk, so it validates:

- The file **extension against an allow-list** — reusing the existing
  `%w[jpg jpeg png]` list `CreateItemPhotosJob` already uses.
- A **max size**, via a new `Settings` entry (e.g.
  `photo_max_upload_size_bytes`; no such setting exists today) to guard
  against disk exhaustion.

Both checks happen before any byte is written to disk, consistent with the
pre-write authorization gate above.
