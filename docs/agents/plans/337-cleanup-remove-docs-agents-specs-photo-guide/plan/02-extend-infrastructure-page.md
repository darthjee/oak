# Extend the infrastructure page

Bring the serving and storage knowledge from `docs/agents/specs/photo/index.md`,
`proxy-rules.md`, `deployment.md` and `rollout.md` into
`docs/agents/architecture/infrastructure.md`, next to the existing
"Production Proxy Configuration" section. Describe the current state only.

- **Topology:** replace "In production there is no `oak_photos` container;
  uploaded files are served by the production infrastructure directly"
  with: in prod, photos are served by the Tent proxy's static `/photos` and
  `/snaps` rules (see below).
- **Rule tree:** add `photos.php` (static `/photos` and `/snaps` from
  `$staticRoot`) to the `proxy/prod_configuration/` tree, and state the rule
  order `frontend → photos/snaps static → uploads → deletes → backend →
  redirects`, with why: static photo rules before the redirect catch-all
  (else a `GET /photos/...` becomes a 302 to `/#/photos/...`), and
  uploads/deletes before `backend.php`.
- **New "Photo Storage and Serving" section:**
  - On-disk prod layout tree (`$REMOTE_HOME/photos/{origin,photos,snaps}`
    as `$storageRoot`; the release dir as `$staticRoot` with `photos` and
    `snaps` symlinks made by `link_photos`; `origin/` is never linked or
    served).
  - The serving invariant: `<storageRoot>/{photos,snaps}/<file_path>` and
    `<staticRoot>/{photos,snaps}/<file_path>` are the same file.
  - Static rules: `CacheControlMiddleware` sets `max-age=604800` on 2xx
    only (a cached 404 would hide a snap made later); a missing file is
    Tent's 404; the 7-day cache is safe because file names contain a UUID
    (`Oak::Photo::CreateBuilder#unique_file_name`).
  - Dev vs prod table (config folder, backend host, storage root, static
    root, max upload size, extension), from `proxy-rules.md`.
  - `OAK_PHOTOS_SERVER_URL` (`Settings.photos_server_url`): the base URL
    `Oak::Photo::FileUrl` uses to build `<url>/{photos,snaps}/<file_path>`;
    in prod it is the Oak (proxy) domain. Placeholder images (`category.png`,
    `kind.png`) come from the frontend's `/assets/images/` and don't use it.
- **Deploy notes worth keeping** from `deployment.md`: `link` uses
  `ln -sfn` so re-runs replace links instead of nesting them; `release`
  removes the old release with `rm -rf`, which deletes the symlinks without
  following them; failed workflows leave their temp dir behind, so clean
  them up by hand now and then. Add only what is not already in the "Deploy"
  bullet.
- Link to [Resizing & Storage](../photo_upload/resizing-and-storage.md) for
  what the handlers write.

Keep the file within ~150 lines. If it doesn't fit, put the "Photo Storage
and Serving" section in a new `docs/agents/architecture/photo-storage.md`
and link it from `infrastructure.md`, `architecture/index.md` and
`summary.md`.

## Files to Change

- `docs/agents/architecture/infrastructure.md` — topology fix, `photos.php`
  and rule order, new photo storage and serving section.
- `docs/agents/architecture/index.md` — update the infrastructure line (or
  add `photo-storage.md` if split out).
