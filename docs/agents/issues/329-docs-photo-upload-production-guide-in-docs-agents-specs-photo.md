# Issue: Docs: photo upload production guide in docs/agents/specs/photo

## Description

Write the temporary implementation guide for the production photo upload work (parent #328) as a set of focused docs under `docs/agents/specs/photo/`. Sub-issues #330–#336 are implemented against this guide, and #337 deletes it at the end.

## Problem

Photo upload works in dev but not in production. The prod proxy has no submit, delete or serving rules. `proxy/extension/` is never deployed. Nothing links a persistent photo folder into each release. Nothing makes the resized `photos/` and `snaps/` versions. The fix spans proxy, CircleCI, backend settings and rollout, split across seven sub-issues. Without one agreed reference, those sub-issues could disagree on paths, rule order and the storage layout.

## Expected Behavior

A guide in `docs/agents/specs/photo/` that each sub-issue can follow without guessing. It fixes these decisions:

- **Storage layout.** The persistent root on the server is `$REMOTE_HOME/photos` (dev: `dev_public_files`), with `origin/`, `photos/` and `snaps/` subfolders.
- **Paths.** The backend keeps returning `file_path = users/<uid>/items/<id>/<file>` unchanged. The proxy gets a single `storageRoot` and adds the prefixes itself:
  - `origin/<file_path>`: the original upload,
  - `photos/<file_path>`: fit within 800x1064, shrink only,
  - `snaps/<file_path>`: fit within 215x215, shrink only.
- **Serving.** `/photos/...` and `/snaps/...` are served by static proxy rules. In prod the static root is the release directory, where `photos` and `snaps` are symlinks into `$REMOTE_HOME/photos`. `Oak::Photo::FileUrl` already builds `photos_server_url/{photos,snaps}/users/...`, so no URL change is needed beyond `OAK_PHOTOS_SERVER_URL`.
- **Invariant:** `storageRoot/{photos,snaps}/<file_path>` is the same file as `staticRoot/{photos,snaps}/<file_path>`, which the request URI resolves to.

## Solution

Create these files (each about 150 lines at most, per the contributing guidelines). They cover only the production work and **link to `docs/agents/photo_upload/` instead of repeating** the Init/Submit/Finalize flow, contracts and auth:

- `index.md`: purpose, the storage layout and path decision above, the sub-issue map (#330–#337 with their dependencies: #334 blocked by darthjee/tent#287, #335 needs #333 and #334, #336 blocked by #251), and links to `photo_upload/`.
- `proxy-rules.md`: the versioned prod config (`configure.php`, `locals.php.sample`, `rules/*.php`); `locals.php` variables (`$backendHost`, `$storageRoot`, `$staticRoot`, max upload size); rule order (frontend → photos/snaps static → uploads → deletes → backend → redirects); static rules with `CacheControlMiddleware` (7 days); dev and prod values side by side.
- `deployment.md`: `upload_proxy_files` uploads the prod config and `proxy/extension/`, and carries the server-only `locals.php` forward. The `link_photos` job uses Oak's `deploy_frontend.sh link` (`ln -s $SOURCE $TARGET`) for `photos` and `snaps`, and `release` requires it. Includes the on-disk layout diagram and the `REMOTE_HOME` env var.
- `resizing.md`: GD (tent:1.0.0) resizing in `PhotoSubmitRequestHandler`: write order (origin → photos → snaps), shrink-only fit, keep the original format (jpg/jpeg/png), `PhotoPathGuard` on every write, finalize only after all three files exist, and delete removing all three.
- `rollout.md`: what ships in which order (#330 and #331 together, before real prod uploads); the #251 file migration into `$REMOTE_HOME/photos/{origin,photos,snaps}`; the `OAK_PHOTOS_SERVER_URL` switch (#336); retiring `photos.oak.ffavs.net` and `prod_public_files/convert.sh`.

Also:

- Add the new docs to `docs/agents/summary.md`.
- Note in `index.md` that #333 no longer changes `file_path` (the proxy adds the prefixes); it only aligns settings, dev mounts and checks.
- Majora's reference material (photo rules, `uploads` rule, `link_photos`, `locals.php`) is summarised in the guide where relevant, since the source notes are not in the repo.
- Content that should outlive the guide moves into `docs/agents/photo_upload/` in #337.

Owner: `architect` (docs only, no code).

## Benefits

- A single reference for proxy, backend and CI work, so the sub-issues agree on paths and rule order.
- The path decision leaves the backend contract unchanged, which shrinks #333.
- Temporary by design: removed in #337 after the lasting parts move to the permanent docs.
