# Specs hub and doc links

Create `docs/agents/specs.md`, the permanent hub for features being developed or planned. It is never deleted.

## Hub content

1. **Purpose.** Specs are temporary design docs tied to one Epic, and its sub-issues implement against them.
2. **Three-level hierarchy:**
   - `docs/agents/specs.md` is this hub. It lists the active features.
   - `docs/agents/specs/<feature>.md` is the feature hub. It indexes the topic files and maps each sub-issue to the topic files it uses.
   - `docs/agents/specs/<feature>/*.md` are the topic files.
3. **Split rule.** Every spec must be split this way, never one large file. Each file stays under ~150 lines.
4. **Lifecycle:**
   - An Epic's first issue writes the feature hub and topic files, and adds a row to this hub.
   - Implementing issues update the spec whenever the implementation has to deviate from it.
   - The Epic's last issue deletes `specs/<feature>.md`, `specs/<feature>/` and the row in this hub.
   - The last issue **may** copy lasting parts (routes, settings, architecture, frontend patterns) into the permanent docs when that makes sense. This is a judgment call.
   - When no feature is active, the hub says "No active specs."
5. **Active specs table** with the columns Feature, Epic and Spec. The first row is `Device authorization`, #391, linking to `specs/authorization.md`.

## Doc links

- `docs/agents/summary.md`: add one row for `specs.md`, like the other docs, placed near Plans and Issues. Do not list feature specs in this file.
- `docs/agents/folder-structure.md`: add `specs/` to the `docs/agents/` table, e.g. "Temporary, Epic-scoped feature specs; see `specs.md`."
- Do not add an `AGENTS.md` section.

## Files to Change
- `docs/agents/specs.md` — new: the permanent specs hub.
- `docs/agents/summary.md` — add a row for the hub.
- `docs/agents/folder-structure.md` — add a `specs/` row under `docs/agents/`.
