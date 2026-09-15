# List proxy in the roster

The specialist roster lives inline as the "Specialist agents" table in
`.claude/agents/architect.md` — there is no separate
`docs/agents/architecture/agent-roster-and-delegation.md` file, and none
should be created for this issue.

Add a `proxy` row to that table:

```markdown
| Agent | Scope |
|-------|-------|
| `backend` | `source/` — Rails app (models, controllers, decorators, builders, views, jobs) |
| `frontend` | `frontend/` — React + Vite SPA |
| `proxy` | `docker_volumes/proxy_configuration/`, `proxy/`, and the `oak_proxy`/`extension_tests` entries in `docker-compose.yml` |
```

Also narrow `architect`'s own "Root-level files" bullet so it no longer
implicitly claims the whole of `docker-compose.yml`:

```markdown
- Root-level files: `README.md`, `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `docker-compose.yml` (except the `oak_proxy`/`extension_tests` service entries, owned by `proxy`), `Makefile`
```

No other doc needs a new entry: `AGENTS.md` and `docs/agents/summary.md`
don't currently enumerate agents, so neither needs touching for this
issue.

## Files to Change

- `.claude/agents/architect.md` — add the `proxy` row to the "Specialist
  agents" table; narrow the "Root-level files" bullet's `docker-compose.yml`
  mention as above.
