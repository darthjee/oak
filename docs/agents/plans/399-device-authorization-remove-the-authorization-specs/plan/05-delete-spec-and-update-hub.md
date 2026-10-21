# Delete the spec and update the hub

With the lasting content preserved:

1. Delete `docs/agents/specs/authorization.md` and the whole `docs/agents/specs/authorization/`
   folder (9 topic files). Delete `docs/agents/specs/` itself if it ends up empty. The hub
   describes it as created per feature, so an empty folder adds nothing.
2. In `docs/agents/specs.md`, replace the Active specs table with the line `No active specs.`, as
   the Lifecycle section says. **Do not delete `docs/agents/specs.md`.**
3. Run `grep -rn "specs/authorization" --exclude-dir=node_modules --exclude-dir=.git .`. No live
   doc may still link to the deleted files. Matches in `docs/agents/issues/` are historical and
   may stay.
4. Check that every link added in steps 01–04 resolves to an existing file.

## Files to Change
- `docs/agents/specs/authorization.md` — deleted.
- `docs/agents/specs/authorization/` — deleted (all topic files).
- `docs/agents/specs.md` — Active specs table replaced with "No active specs."
