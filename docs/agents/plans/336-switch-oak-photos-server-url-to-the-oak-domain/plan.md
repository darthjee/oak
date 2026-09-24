# Plan: Switch OAK_PHOTOS_SERVER_URL to the Oak domain

Issue: [336-switch-oak-photos-server-url-to-the-oak-domain.md](../../issues/336-switch-oak-photos-server-url-to-the-oak-domain.md)

## Overview
Before `OAK_PHOTOS_SERVER_URL` is pointed at the Oak domain, decouple the
placeholder images from the photo host: the frontend ships `category.png` and
`kind.png` under `/assets/images/`, and the backend decorators return those
paths instead of `<photos_server_url>/<name>.png`. The env switch itself, the
verification and the retirement of `photos.oak.ffavs.net` are a manual
post-merge checklist (see the issue).

## Agents involved

- [frontend](frontend.md)
- [backend](backend.md)

## Shared contracts

- Placeholder URLs returned in the `snap_url` field when an object has no
  main photo (root-relative, no host):
  - `Oak::Category::Decorator`, `Oak::Category::FormDecorator`,
    `Oak::Item::IndexDecorator` → `/assets/images/category.png`
  - `Oak::Kind::Decorator` → `/assets/images/kind.png`
- The frontend must serve both files at exactly those paths. `bin/deploy_frontend.sh build`
  already rsyncs `frontend/assets/images/` into `dist/assets/images/`, the prod
  proxy serves `/assets` from `$staticRoot/static`, and the dev proxy/vite serve
  `/assets/images/` from `frontend/assets/images/`.
- Photo/snap URLs for real photos (`Oak::Photo::FileUrl`) are unchanged: they
  keep using `Settings.photos_server_url`.

## Architect follow-up (docs)
- `docs/agents/specs/photo/rollout.md` (#336 section) and
  `docs/agents/specs/photo/index.md`: note that placeholders are now served
  from `/assets/images/` and no longer depend on the photo host, and that the
  URL switch steps are a manual checklist on the issue. The rollback mention
  of `photos.oak.ffavs.net` stays until the host is retired; the whole
  `specs/photo/` folder is removed by #337.

## Notes
- `prod_public_files/` (convert.sh, favicons, the original placeholder files)
  is intentionally left untouched.
- Deploy order: ship this change (backend + frontend) before switching the env
  var; it is safe to ship while the env var still points at the old host.
