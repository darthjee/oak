# Plan: Move external tools docs into external

Issue: [214-move-external-tools-docs-into-external.md](../../issues/214-move-external-tools-docs-into-external.md)

## Overview
Move the six external tool/gem reference docs currently sitting flat in `docs/agents/` into a new `docs/agents/external/` subfolder, filenames unchanged, and update every link that points at their old location. Document `docs/agents/external/` as the standing convention for future external tool/gem docs.

## Context
`docs/agents/` mixes internal architecture/process docs (architecture, flow, routes, contributing) with reference docs for third-party tools and gems (Darthjee-Tent, Navi, Azeroth, Jace, Magicka, Sinclair). This makes it hard to tell at a glance which docs describe Oak's own architecture versus an external dependency. No file has internal cross-references to any of the six files being moved (verified via grep), so this is a pure move + link-fix, no content rewrites needed.

## Implementation Steps

### Step 1 — Create the folder and move the files
Create `docs/agents/external/` and `git mv` the six files into it, keeping filenames identical:
- `docs/agents/HOW_TO_USE_DARTHJEE-TENT.md` → `docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md`
- `docs/agents/HOW_TO_USE_NAVI.md` → `docs/agents/external/HOW_TO_USE_NAVI.md`
- `docs/agents/azeroth-usage.md` → `docs/agents/external/azeroth-usage.md`
- `docs/agents/jace-usage.md` → `docs/agents/external/jace-usage.md`
- `docs/agents/magicka-usage.md` → `docs/agents/external/magicka-usage.md`
- `docs/agents/sinclair-usage.md` → `docs/agents/external/sinclair-usage.md`

### Step 2 — Update all referencing links
Update every markdown link pointing at the old flat paths to the new `docs/agents/external/...` path:
- `AGENTS.md` — 4 gem usage-guide inline links (sinclair, azeroth, magicka, jace), 2 "full reference" callouts (magicka, azeroth), and the documentation table rows for `HOW_TO_USE_NAVI` and `HOW_TO_USE_DARTHJEE-TENT`.
- `docs/agents/architecture.md` — links to `HOW_TO_USE_DARTHJEE-TENT.md` (x2), `azeroth-usage.md`, `magicka-usage.md`, `sinclair-usage.md`, `jace-usage.md`.
- `docs/agents/flow.md` — link to `HOW_TO_USE_DARTHJEE-TENT.md`.
- `docs/agents/folder-structure.md` — link to `HOW_TO_USE_DARTHJEE-TENT.md`.
- `.claude/agents/backend.md` — links to `azeroth-usage.md`, `magicka-usage.md`, `sinclair-usage.md`, `jace-usage.md`.

Note: `AGENTS.md:318` links to `.github/magicka-usage.md`, a path that does not exist in the repo (pre-existing broken link, unrelated to this move) — leave it as-is; out of scope for this issue.

### Step 3 — Verify no other stale references remain
Re-run a repo-wide grep for the six filenames after the edits to confirm only the new `docs/agents/external/...` paths remain (plus the unrelated pre-existing broken link noted above).

### Step 4 — Document the convention
Add a short note to `docs/agents/folder-structure.md` stating that reference docs for external tools/gems belong in `docs/agents/external/`, so future docs of this kind are added there going forward.

## Files to Change
- `docs/agents/HOW_TO_USE_DARTHJEE-TENT.md` → moved to `docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md`
- `docs/agents/HOW_TO_USE_NAVI.md` → moved to `docs/agents/external/HOW_TO_USE_NAVI.md`
- `docs/agents/azeroth-usage.md` → moved to `docs/agents/external/azeroth-usage.md`
- `docs/agents/jace-usage.md` → moved to `docs/agents/external/jace-usage.md`
- `docs/agents/magicka-usage.md` → moved to `docs/agents/external/magicka-usage.md`
- `docs/agents/sinclair-usage.md` → moved to `docs/agents/external/sinclair-usage.md`
- `AGENTS.md` — update 8 links to the moved files
- `docs/agents/architecture.md` — update 6 links to the moved files
- `docs/agents/flow.md` — update 1 link
- `docs/agents/folder-structure.md` — update 1 link, plus add the new convention note
- `.claude/agents/backend.md` — update 4 links

## Notes
- No CI job lints markdown links in this repo, so link updates must be verified manually via grep rather than a CI check.
- Filenames are kept exactly as they are today (confirmed in discussion) — no renaming to a uniform `<tool>-usage.md` style as part of this issue.
