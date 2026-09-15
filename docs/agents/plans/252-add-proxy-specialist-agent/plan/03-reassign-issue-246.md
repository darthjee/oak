# Reassign issue #246

#246's issue/plan files live on the separate `issue-246` branch (already
committed there, not yet merged to `main`) — not on `issue-252`. This step
needs an explicit branch switch, edits, commit, and push there, then a
switch back to `issue-252` before continuing.

`docs/agents/issues/246-proxy-tent-multipart-submit-rule.md` doesn't name
`architect` anywhere and needs no change. The plan does: today it has no
per-agent file (`docs/agents/plans/246-proxy-tent-multipart-submit-rule/`
holds only `plan.md` + a `plan/` step folder), which is exactly the
"no owner" shape that `auto-fix-issue` dispatches to `architect` by
default. Reassigning to `proxy` means converting it to the single-owner
shape: rename `plan.md` → `proxy.md` (full content) and `plan/` →
`proxy/` (step files), replaced by a minimal pointer `plan.md`.

## Steps

1. `git -C "$REPO_PATH" fetch origin` then
   `git -C "$REPO_PATH" checkout issue-246` (create it tracking
   `origin/issue-246` if not already local).
2. `git -C "$REPO_PATH" mv docs/agents/plans/246-proxy-tent-multipart-submit-rule/plan.md docs/agents/plans/246-proxy-tent-multipart-submit-rule/proxy.md`
3. `git -C "$REPO_PATH" mv docs/agents/plans/246-proxy-tent-multipart-submit-rule/plan docs/agents/plans/246-proxy-tent-multipart-submit-rule/proxy`
4. Edit the renamed `proxy.md`:
   - In `## Context`, change the closing clause of the last sentence from
     "...so this plan has no single specialist owner and stays with
     `architect`." to "...so this plan is owned by the `proxy` specialist
     agent introduced in #252."
   - In `## Steps`, update each link target from `plan/0N-*.md` to
     `proxy/0N-*.md`.
   - In `## Notes`, replace the bullet "Once #252 lands and a `proxy` agent
     exists, future work on `docker_volumes/proxy_configuration/` and
     `proxy/` should move to it — this plan doesn't reassign
     retroactively." with "This plan has been reassigned from `architect`
     to the `proxy` specialist agent (#252)."
5. Write a new minimal pointer `plan.md`:
   ```markdown
   # Plan: Proxy — Tent multipart submit rule

   Issue: [246-proxy-tent-multipart-submit-rule.md](../issues/246-proxy-tent-multipart-submit-rule.md)

   ## Overview

   Introduce Oak's first Tent extension: a custom `RequestHandler`, mounted
   via a new top-level `proxy/extension/loader.php`, that handles the
   `multipart/form-data` "Submit" step of the photo upload flow.

   See [proxy.md](proxy.md) for the full plan.
   ```
6. Commit (e.g. `docs(plan): reassign issue #246 to proxy agent (issue
   #252)`) and `git -C "$REPO_PATH" push` to `origin/issue-246`.
7. `git -C "$REPO_PATH" checkout issue-252` to return to this issue's
   branch before continuing with any further work.

## Files to Change

On the `issue-246` branch:
- `docs/agents/plans/246-proxy-tent-multipart-submit-rule/plan.md` — replaced with a minimal pointer to `proxy.md`.
- `docs/agents/plans/246-proxy-tent-multipart-submit-rule/proxy.md` — new (renamed from `plan.md`); ownership/links updated per above.
- `docs/agents/plans/246-proxy-tent-multipart-submit-rule/proxy/01-custom-submit-handler.md` — renamed from `plan/01-custom-submit-handler.md`, content unchanged.
- `docs/agents/plans/246-proxy-tent-multipart-submit-rule/proxy/02-wire-new-rule.md` — renamed from `plan/02-wire-new-rule.md`, content unchanged.
- `docs/agents/plans/246-proxy-tent-multipart-submit-rule/proxy/03-docker-compose-env.md` — renamed from `plan/03-docker-compose-env.md`, content unchanged.
- `docs/agents/plans/246-proxy-tent-multipart-submit-rule/proxy/04-extension-tests.md` — renamed from `plan/04-extension-tests.md`, content unchanged.
