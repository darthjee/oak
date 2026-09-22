# Index and layout decision

Create `docs/agents/specs/photo/index.md`, the entry point of the guide:

- A summary saying the page is temporary (removed in #337) and scoped to #328.
- **Storage layout**: storage root `$REMOTE_HOME/photos` in prod and `dev_public_files` in dev, with `origin/`, `photos/` and `snaps/` subfolders.
- **Path decision**: the backend `file_path` stays `users/<uid>/items/<id>/<file>`. The proxy gets one `storageRoot` and writes `origin/<file_path>`, `photos/<file_path>` (800x1064, shrink only) and `snaps/<file_path>` (215x215, shrink only).
- **Invariant**: `storageRoot/{photos,snaps}/<file_path>` is the same file that `staticRoot` + the request URI resolves to (through the release symlinks in prod).
- **Sub-issue map**: #330–#337 with owners and dependencies (#334 blocked by darthjee/tent#287; #335 needs #333 and #334; #336 blocked by #251; #337 last). Note that #333 no longer changes `file_path`.
- Links to the other spec pages, and to `docs/agents/photo_upload/index.md` for the Init/Submit/Finalize flow.

## Files to Change
- `docs/agents/specs/photo/index.md`: new.
