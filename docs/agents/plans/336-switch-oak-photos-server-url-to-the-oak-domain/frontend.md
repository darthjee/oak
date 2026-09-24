# Frontend Plan: Switch OAK_PHOTOS_SERVER_URL to the Oak domain

Main plan: [plan.md](plan.md)

## Shared contracts

- Must serve `/assets/images/category.png` and `/assets/images/kind.png`.
  The backend will return these root-relative paths as `snap_url` for
  categories, kinds and items without a photo.

## Implementation Steps

### Step 1 — Add the placeholder images
Copy `prod_public_files/category.png` and `prod_public_files/kind.png` into
`frontend/assets/images/` (copy, do not move: `prod_public_files/` stays
untouched). No code change is needed: `bin/deploy_frontend.sh build` already
copies `assets/images/` into `dist/assets/images/`, and the `/assets` proxy
rules already serve them in dev and prod.

## Files to Change
- `frontend/assets/images/category.png` — new, copy of `prod_public_files/category.png`.
- `frontend/assets/images/kind.png` — new, copy of `prod_public_files/kind.png`.

## Notes
- Check in dev (`http://localhost:3000/assets/images/category.png` through the
  proxy) that the images load.
