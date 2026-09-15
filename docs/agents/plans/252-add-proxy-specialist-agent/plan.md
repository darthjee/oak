# Plan: Add proxy specialist agent

Issue: [252-add-proxy-specialist-agent.md](../issues/252-add-proxy-specialist-agent.md)

## Overview

Add a new `proxy` specialist agent (`.claude/agents/proxy.md`) that owns
`docker_volumes/proxy_configuration/`, the upcoming `proxy/` folder (Tent
extension mechanism, per #245/#246), and the `oak_proxy`/`extension_tests`
entries in root `docker-compose.yml`. List it in `architect.md`'s
specialist table, then reassign #246 from `architect` to `proxy`.

## Context

#245 (Photo Upload spec) established that the new HTTP photo upload flow
needs Tent's extension mechanism — a new top-level `proxy/` folder with its
own PHP code and `darthjee/tent-test` PHPUnit tooling. #244's original
split pencilled that work (#246) in under `architect`, but it's substantial
enough to warrant a dedicated specialist instead of growing `architect`'s
already broad cross-cutting scope indefinitely. `docker-compose.yml`
otherwise stays under `architect`'s root-level-files scope; only the
proxy-service entries are carved out.

No repo agent split applies here: this issue is agent-definition/docs work
that doesn't touch `source/` (`backend`) or `frontend/` (`frontend`), so
`architect` (the coordinator) does it directly — hence a single plan with
no `## Agents involved`/`## Shared contracts` sections.

## Steps

- [01 — Create the proxy agent](plan/01-create-proxy-agent.md)
- [02 — List proxy in the roster](plan/02-update-architect-roster.md)
- [03 — Reassign issue #246](plan/03-reassign-issue-246.md)

## Notes

- Step 03 edits files that live on the separate `issue-246` branch, not
  `issue-252` — it needs an explicit branch switch (and switch-back), not a
  same-branch edit like Steps 01–02.
- `proxy/extension/loader.php` and the `extension_tests` Compose service
  themselves are #246's job (already covered by its own plan); this issue
  only creates the agent and reassigns ownership.
