# Delete the guide and update the indexes

Once steps 01 and 02 hold the lasting content:

1. Delete `docs/agents/specs/photo/` (`index.md`, `proxy-rules.md`,
   `deployment.md`, `resizing.md`, `rollout.md`, `examples.md`) and the
   now-empty `docs/agents/specs/`.
2. In `docs/agents/summary.md`, remove the six "Photo in Production" rows,
   add a row for [Photo Upload — Resizing & Storage](photo_upload/resizing-and-storage.md),
   and update the Infrastructure row's description to mention photo storage
   and serving (plus a row for `architecture/photo-storage.md` if step 02
   split it out).
3. Check `docs/agents/folder-structure.md` for any mention of `specs/` under
   `docs/agents/` and remove it.
4. Run `grep -rn "specs/photo" docs AGENTS.md .claude --include=*.md` and fix
   every hit outside `docs/agents/issues/` and `docs/agents/plans/` (those are
   historical and stay as they are).

## Files to Change

- `docs/agents/specs/photo/*.md` — deleted.
- `docs/agents/summary.md` — remove six rows, add the new page(s), update
  the Infrastructure description.
- `docs/agents/folder-structure.md` — only if it mentions `specs/`.
