# Split into per-topic docs

Break the Step 1 draft into `docs/agents/photo_upload/*.md`, mirroring the granularity and shape of `docs/agents/architecture/` (`index.md` + 2 topic files) and `docs/agents/routes/` (`index.md` + 2 topic files) — see #238/#239/#240/#241/#242 for precedent. Then delete the flat draft: no other doc in this repo keeps both a pre-split flat file and its split folder (there's no `docs/agents/architecture.md` alongside `docs/agents/architecture/`), so `docs/agents/specs/photo_upload.md` was a drafting waypoint only.

## File breakdown

- **`docs/agents/photo_upload/index.md`** — overview: the three-step flow (Init/Submit/Finalize) and its ownership table, one paragraph per topic file linking out to it, same style as `docs/agents/architecture/index.md`.
- **`docs/agents/photo_upload/contracts.md`** — the concrete routes and request/response shapes worked out in Step 1 (Init, Submit, the shared status-gate/Finalize endpoint).
- **`docs/agents/photo_upload/data-model-and-migration.md`** — the `ready` column decision, the two-step migration, `CreateItemPhotosJob`'s explicit `ready: true`, and the `photos` controller method's `action_name` scoping (with the code snippet).
- **`docs/agents/photo_upload/proxy-and-auth.md`** — the Tent extension mechanism requirement, the new `proxy/` folder and its `proxy` agent ownership (#252), session-cookie reuse and `Cookie` forwarding, the pre-write authorization gate, and upload validation (extension allow-list + max size).
- **`docs/agents/photo_upload/edge-cases-and-coexistence.md`** — abandoned uploads (no cleanup job), duplicate/replay guard, and the "relationship to the existing flow" section (coexistence with `CreateItemPhotosJob`/`ProcessUserItemPhotosJob`, with pointers to #249/#250/#251 for the deprecation/migration work this doc explicitly doesn't decide).

Each file stays close to the repo's ~150-line-per-file documentation target (`docs/agents/contributing/index.md`); split further only if a topic genuinely runs long.

Cross-link every file back to `index.md` the same way `docs/agents/architecture/infrastructure.md` etc. do (a `[← Back to ...]`-style link or equivalent header link, matching whichever convention the target folder you're copying from actually uses).

## Files to Change

- `docs/agents/specs/photo_upload.md` — removed (superseded by the split below)
- `docs/agents/photo_upload/index.md` — new
- `docs/agents/photo_upload/contracts.md` — new
- `docs/agents/photo_upload/data-model-and-migration.md` — new
- `docs/agents/photo_upload/proxy-and-auth.md` — new
- `docs/agents/photo_upload/edge-cases-and-coexistence.md` — new
