# Issue: Cleanup: remove docs/agents/specs/photo guide

## Description
Last sub-issue of #328. `docs/agents/specs/photo/` (index, proxy-rules, deployment, resizing, rollout, examples — about 720 lines) was a temporary implementation guide for shipping photo upload to production. Everything in it is implemented: #329–#336 are closed, the legacy file migration (#251, via #380–#382) ran and was removed in #379, and #379 already dropped the migration section from `rollout.md`. Nothing is left to build from the guide, so it can go once its lasting knowledge is in the permanent docs.

## Problem
- The guide is still linked from `docs/agents/summary.md` (six rows marked "Temporary (#328)"), so agents keep reading a plan-shaped doc for code that already shipped.
- Some lasting knowledge exists only in the guide:
  - Resizing (`PhotoImageResizer`, `PhotoVersionStorer`, `PhotoSubmitBackendGateway`): GD in the proxy, `photos/` fit in 800x1064 and `snaps/` fit in 215x215, shrink-only, format kept, EXIF orientation, rollback and no finalize on failure.
  - Delete (`PhotoFileDeleter`) removes `origin/`, `photos/` and `snaps/`; a missing file is not an error.
  - The storage layout and serving invariant, and the static `/photos` and `/snaps` rules (`rules/photos.php`: cache headers, 404 not 302).
  - `OAK_PHOTOS_SERVER_URL` and the root-relative placeholder `snap_url`s.
  - The prod checklist in `rollout.md`, which #336's post-merge checklist points to.
- `docs/agents/architecture/infrastructure.md` already covers the prod proxy config, `locals.php` and the `link_photos` job, so those need little or no move.

## Expected Behavior
- `docs/agents/specs/photo/` is gone, and `docs/agents/specs/` too since it will be empty.
- The lasting knowledge above is in `docs/agents/photo_upload/` or `docs/agents/architecture/`.
- No doc links to `specs/photo/`, and the markdown lint / link check passes.

## Solution
1. Move the lasting content:
   - New page `docs/agents/photo_upload/resizing-and-storage.md`: resize rules, failure handling, delete of all three versions, and the class split. Link it from `photo_upload/index.md` and `summary.md`.
   - `architecture/infrastructure.md`: storage layout, serving invariant, static `/photos` and `/snaps` rules, `OAK_PHOTOS_SERVER_URL`, and the prod photo checklist, next to the existing `link_photos` / `locals.php` text.
2. Delete the plan-only content without moving it: ship order, sub-issue map, dependency table, proposed PHP / CircleCI snippets (`examples.md`). It is all in the code and git history.
3. Delete `docs/agents/specs/photo/` and the now-empty `docs/agents/specs/`, and remove the six rows in `summary.md`.
4. Grep for `specs/photo` and `specs/` across `docs/`, `AGENTS.md` and `.claude/`, and fix any remaining link. Links inside `docs/agents/issues/` and `docs/agents/plans/` are historical and stay as they are.
