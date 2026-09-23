# Issue: Add photo upload/delete rules to prod proxy config and deploy proxy extension

## Description
Production photo submit fails with a 404 from the Tent proxy:

```
[404] - no rules matched — method: POST, uri: /uploads/categories/project/items/132/photos/549/submit
```

Part of #328. Depends on #339, which already committed the prod proxy config to `proxy/prod_configuration/` (with a server-only, gitignored `locals.php`) and made `upload_proxy_files` deploy it and carry `locals.php` forward. Design guide: `docs/agents/specs/photo/proxy-rules.md`, `deployment.md` and `examples.md`.

## Problem
- `proxy/prod_configuration/` only has `frontend`, `backend` and `redirects` rules. It has no `uploads`/`deletes` rules, so the photo submit and delete routes fall through to "no rules matched".
- `proxy/extension/` is never deployed. The Tent upload ships an empty `extension/loader.php`, so the photo handler classes are unavailable in prod.

## Expected Behavior
- `POST /uploads/categories/:slug/items/:id/photos/:photo_id/submit` and `DELETE /uploads/categories/:slug/items/:id/photos/:photo_id` are routed to the custom handlers in prod.
- A prod deploy ships `extension/` from `proxy/extension/`, with the real `loader.php`.
- Uploaded originals land in persistent storage outside the release directory.

### Acceptance criteria
- [ ] `proxy/prod_configuration/rules/uploads.php` and `deletes.php` exist, and `configure.php` loads them in the order `frontend` → `uploads` → `deletes` → `backend` → `redirects`.
- [ ] `locals.php.sample` documents `$storageRoot` and `$maxUploadSizeBytes`.
- [ ] `ProdConfigurationRoutingTest` covers submit and delete routing to the photo handlers, and they take precedence over `backend`/`redirects`.
- [ ] On a prod deploy, `extension/` is present and its `loader.php` is the one from `proxy/extension/`.
- [ ] Prod `POST .../photos/:photo_id/submit` no longer returns "no rules matched", and prod `DELETE .../photos/:photo_id` is routed to `PhotoDeleteRequestHandler`.
- [ ] The PR description lists the manual release steps: new `locals.php` variables, `photos/origin` folder, and the PHP upload limit check.
- [ ] Proxy specs pass.

## Solution
### Prod config additions (`proxy/prod_configuration/`)
- `rules/uploads.php` and `rules/deletes.php`: same regex matchers and handler classes as the dev rules in `docker_volumes/proxy_configuration/rules/`, but reading values from `locals.php`:
  - `host => $backendHost`
  - `photosPath => $storageRoot . '/origin'` (interim until #335 switches to a `storageRoot` option)
  - `maxUploadSizeBytes => $maxUploadSizeBytes` (submit only; prod value 10 MB, `10 * 1024 * 1024`)
- `configure.php`: require `uploads.php` and `deletes.php` after `frontend.php` and before `backend.php`. The static `photos`/`snaps` rules are added later by #332, between `frontend` and `uploads`.
- `locals.php.sample`: add `$storageRoot` (persistent photo root, `$REMOTE_HOME/photos`) and `$maxUploadSizeBytes`. `$storageRoot` names the root instead of the issue's original `$photosPath`, so #335 needs no server-side `locals.php` change.
- Extend `proxy/extension_tests/ProdConfigurationRoutingTest.php` with inline values for the new locals.

### CircleCI `upload_proxy_files`
Add a step that uploads `proxy/extension/` into the release's `extension/`, **after** the Tent upload, so the real `loader.php` overwrites Tent's empty one. Same pattern as the existing prod configuration upload: `SOURCE=proxy/extension/ SSH_REMOTE_TEMP_DIR=$SSH_REMOTE_TEMP_DIR/extension/ deploy_frontend.sh upload`.

### Manual release step
Before tagging the #330 release, add `$storageRoot` and `$maxUploadSizeBytes` to the live `configuration/locals.php`, and create `$REMOTE_HOME/photos/origin` on the server. Also check that Dreamhost's PHP `upload_max_filesize` and `post_max_size` are at least 10 MB; otherwise large uploads are rejected before reaching the handler. Document these steps in the PR description.

### Out of scope
- The prod config, `locals.php` carry-forward and `.gitignore` entry: already done in #339.
- Linking persistent `photos/`/`snaps/` into the release: #331.
- Static photo/snap serving rules and cache middleware: #332.
- Handler `storageRoot` option with `origin/`/`photos/`/`snaps/` prefixes: #335.

## Benefits
- Fixes photo upload and delete in production.
- New prod routing is versioned and covered by `ProdConfigurationRoutingTest`. Only host values stay on the server.
- Uploaded originals survive releases, since they are stored outside the release directory.
