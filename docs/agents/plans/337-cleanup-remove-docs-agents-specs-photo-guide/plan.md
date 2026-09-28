# Plan: Cleanup: remove docs/agents/specs/photo guide

Issue: [337-cleanup-remove-docs-agents-specs-photo-guide.md](../../issues/337-cleanup-remove-docs-agents-specs-photo-guide.md)

## Overview

Move the lasting knowledge out of the temporary `docs/agents/specs/photo/`
guide into the permanent docs, then delete the guide and every link to it.
This is a docs-only change, owned by the architect; no code changes.

## Context

- The guide (index, proxy-rules, deployment, resizing, rollout, examples)
  was written for #328. Sub-issues #329–#336 are closed, the legacy file
  migration (#251) ran and was removed in #379, and nothing in the guide is
  left to build.
- `docs/agents/architecture/infrastructure.md` already covers the prod proxy
  config, `upload_proxy_files`, `link_photos`, `locals.php` and the one-time
  bootstrap. Its rule tree is missing `photos.php`, and its topology section
  still describes photos in prod as "served by the production
  infrastructure directly".
- Content found only in the guide:
  - resize and delete rules (`resizing.md`);
  - storage layout, path decision and serving invariant (`index.md`);
  - rule order, static `/photos` and `/snaps` rules, dev vs prod values
    (`proxy-rules.md`);
  - on-disk release layout and `bin/deploy_frontend.sh` notes
    (`deployment.md`);
  - `OAK_PHOTOS_SERVER_URL` (`Settings.photos_server_url`, used by
    `Oak::Photo::FileUrl`) and the prod checklist (`rollout.md`).
- Plan-only content that is dropped without moving: the ship order, the
  sub-issue map and its dependency table, the "#330 interim" notes, and all
  of `examples.md`. The code and git history already hold them.

## Steps

- [01 — Add the resizing and storage page](plan/01-add-resizing-and-storage-page.md)
- [02 — Extend the infrastructure page](plan/02-extend-infrastructure-page.md)
- [03 — Delete the guide and update the indexes](plan/03-delete-guide-and-update-indexes.md)

## CI Checks

- Markdown is linted by Codacy (markdownlint) on the PR; there is no local
  CI job for `docs/`. Optionally run `npx markdownlint-cli2 "docs/agents/**/*.md"`
  on the changed files.
- Link check: `grep -rn "specs/photo" docs AGENTS.md .claude --include=*.md`
  must only match files under `docs/agents/issues/` and
  `docs/agents/plans/`.

## Notes

- Follow `docs/agents/contributing/index.md`: English only, ~150 lines per
  file. If `infrastructure.md` goes past ~150 lines, move the new photo
  section into `docs/agents/architecture/photo-storage.md`, linked from
  `architecture/index.md` and `summary.md`, instead of growing it further.
- Links to `specs/photo/` inside `docs/agents/issues/` and
  `docs/agents/plans/` are historical records and stay unchanged.
- Out of scope: closing #250/#251, the #336 manual server checklist, and
  removing `prod_public_files/` / `convert.sh` (candidate follow-up issue).
