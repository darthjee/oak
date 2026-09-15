# Issue: Add proxy specialist agent

## Description
Add a new `proxy` specialist agent (`.claude/agents/proxy.md`), mirroring the existing `architect`/`backend`/`frontend` pattern, and reassign ownership of the proxy-related root-level surface to it.

## Problem
Issue #245 (Docs — Photo upload spec) established that the new HTTP photo upload flow requires introducing Tent's extension mechanism — a new top-level `proxy/` folder (`proxy/extension/loader.php` + custom PHP `RequestHandler` classes) alongside the existing `docker_volumes/proxy_configuration/`. #244's original split assigned that work (#246) to `architect`, reasoning it was "root-level infra, not `source/`/`frontend/`" — but it's substantial enough (its own PHP code, its own test tooling via `darthjee/tent-test`, ongoing rule maintenance) to warrant a dedicated specialist rather than folding indefinitely into `architect`'s already broad cross-cutting scope.

## Solution
- Create `.claude/agents/proxy.md` following the shape of `.claude/agents/backend.md`/`frontend.md` (frontmatter: `name`, `description`, `tools: Read, Edit, Write, Bash`; body: scope, stack, commands).
- Scope: `docker_volumes/proxy_configuration/` (existing rules), the new `proxy/` folder (extension loader, custom handlers, matchers, middlewares, and their `darthjee/tent-test` PHPUnit specs) once #246 creates it, and the `oak_proxy`/`extension_tests` service entries in root `docker-compose.yml` — carved out of `architect`'s root-level-files scope, which keeps the rest of that file.
- Update the "Specialist agents" table in `.claude/agents/architect.md` to list the new `proxy` agent (the roster's actual home today — no separate `docs/agents/architecture/agent-roster-and-delegation.md` file exists or needs creating).
- Reassign #246 ("Proxy — Tent multipart submit rule") to the new `proxy` specialist instead of `architect`, updating the already-drafted issue/plan files on the `issue-246` branch that currently credit `architect`.
- **Out of scope:** implementing #246 itself (the actual Tent rule/handler), and any other repo restructuring.

## Benefits
- Gives the growing proxy/Tent surface a dedicated owner instead of overloading `architect`'s already-broad cross-cutting scope.
- Keeps root-level folder ownership explicit and unambiguous, per the repo's agent-roster convention.
