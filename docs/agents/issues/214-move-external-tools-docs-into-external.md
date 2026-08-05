# Issue: Move external tools docs into external

## Description
`docs/agents/` mixes internal architecture/process docs with reference docs for external tools and gems (Darthjee-Tent, Navi, Azeroth, Jace, Magicka, Sinclair). These external-tool docs should live in a dedicated `docs/agents/external/` subfolder instead of sitting flat alongside the internal docs.

## Problem
With internal docs (architecture, flow, routes, contributing) and third-party tool/gem reference docs (`HOW_TO_USE_DARTHJEE-TENT.md`, `HOW_TO_USE_NAVI.md`, `azeroth-usage.md`, `jace-usage.md`, `magicka-usage.md`, `sinclair-usage.md`) all sitting flat in `docs/agents/`, it is not immediately clear which docs describe this project's own architecture versus which describe external dependencies.

## Expected Behavior
- All external tool/gem reference docs live under `docs/agents/external/`, filenames unchanged:
  - `docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md`
  - `docs/agents/external/HOW_TO_USE_NAVI.md`
  - `docs/agents/external/azeroth-usage.md`
  - `docs/agents/external/jace-usage.md`
  - `docs/agents/external/magicka-usage.md`
  - `docs/agents/external/sinclair-usage.md`
- Every existing link to these files is updated to the new path so nothing breaks.

## Solution
1. Create `docs/agents/external/` and `git mv` the 6 files into it, unchanged.
2. Update all referencing links to the new path, including:
   - `AGENTS.md` (gem usage-guide links and the documentation table)
   - `docs/agents/architecture.md`
   - `docs/agents/flow.md`
   - `docs/agents/folder-structure.md`
   - `.claude/agents/backend.md`
3. Verify no other file (docs, CI config) still points at the old flat paths.
4. Document `docs/agents/external/` as the standing convention for external tool/gem docs (e.g. a short note in `docs/agents/folder-structure.md`), so future docs of this kind are added there going forward.

## Benefits
- Clear separation between this project's own docs and third-party tool/gem references.
- Easier to find the right doc, and a clear, documented place to add docs for future external tools.
