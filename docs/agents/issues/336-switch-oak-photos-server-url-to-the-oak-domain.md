# Issue: Switch OAK_PHOTOS_SERVER_URL to the Oak domain

## Description
Point production photo URLs at the Oak domain (served by the Tent proxy on Dreamhost) instead of `photos.oak.ffavs.net`, then retire the old host. Part of #328; see `docs/agents/specs/photo/rollout.md`.

Blocked by #251: existing photos, snaps and originals must first be copied into `$REMOTE_HOME/photos/{photos,snaps,origin}`.

## Problem
- The backend builds every photo/snap URL from `Settings.photos_server_url` (`OAK_PHOTOS_SERVER_URL`, set only in the Render env), which still points at `photos.oak.ffavs.net`. Uploads made through the new proxy flow live under `$REMOTE_HOME/photos` and render as broken images until the switch.
- The same base URL is used for the placeholder images: the `Category`, `Category::Form`, `Kind` and `Item::Index` decorators return `<photos_server_url>/category.png` or `<photos_server_url>/kind.png` when there is no main photo. These files live at the old host's root (`prod_public_files/`). On the Oak domain, `/category.png` matches no static rule and falls into the redirect catch-all, so placeholders would break after the switch.

## Expected Behavior
- API responses return photo and snap URLs on the Oak domain (`/photos/...`, `/snaps/...`), and they load with no broken images for existing items.
- Placeholder images for categories, kinds and items without a photo load from the frontend assets (`/assets/images/category.png`, `/assets/images/kind.png`), independent of `OAK_PHOTOS_SERVER_URL`.
- Outside `prod_public_files/`, nothing references `photos.oak.ffavs.net`.

## Solution
### Code (PR)
- Copy `category.png` and `kind.png` into `frontend/assets/images/` (frontend).
- Change the four decorators (`Category`, `Category::Form`, `Kind`, `Item::Index`) to return `/assets/images/<name>.png` for the placeholder instead of `<photos_server_url>/<name>.png`, and update their specs (backend). The `/assets` static rule already serves these in prod and dev.
- Update docs that mention the old host (rollout guide, photo spec index) to reflect the switch.

### Out of scope
- `prod_public_files/` (including `convert.sh`, favicons and `item.png`) stays untouched for now; it will be handled in a later issue.
- `navi/navi_config.yaml` needs no change: it does not reference the old host.

### Manual post-merge checklist
- [ ] Deploy the placeholder change (backend on Render, frontend via the proxy deploy).
- [ ] Set `OAK_PHOTOS_SERVER_URL` in the Render env to the Oak domain and redeploy the backend.
- [ ] Check that existing and newly uploaded photos and snaps load from `/photos/...` and `/snaps/...`, and that placeholders load.
- [ ] Run the prod checklist in `docs/agents/specs/photo/rollout.md`.
- [ ] Retire `photos.oak.ffavs.net` on Dreamhost once the new URLs are verified (rollback until then: set the env var back).

## Benefits
- One domain serves the app and its photos, and the separate photo host can be retired.
- Placeholder images no longer depend on the photo host at all.
