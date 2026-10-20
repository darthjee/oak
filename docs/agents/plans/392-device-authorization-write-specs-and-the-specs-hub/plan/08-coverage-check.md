# Coverage and consistency check

Verify the specs before finishing.

1. **Coverage.** Walk through #391's sections and confirm that each numbered item appears in at least one topic file:
   - Edge cases 1–13 and Decisions;
   - Backward compatibility 1–7;
   - Adapting the reference to Oak 1–12;
   - Performance & security 1–8, and Out of scope.
2. **Consistency.** Names must be identical in every file that uses them: endpoint paths, field names, status values, setting names and defaults, event names, and the route.
3. **Self-contained.** `grep -rn "messages/\|kerghan/seahorse" docs/agents/specs*` returns nothing.
4. **Size.** `wc -l docs/agents/specs.md docs/agents/specs/authorization.md docs/agents/specs/authorization/*.md` shows every file at or under ~150 lines.
5. **Links.** Every relative link in the new files and the edited `summary.md` / `folder-structure.md` resolves to an existing file.

## Files to Change
- Any file from steps 01–07 that fails a check.
