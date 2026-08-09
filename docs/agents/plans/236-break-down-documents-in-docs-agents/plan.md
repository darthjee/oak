# Plan: Break down documents in docs/agents

Issue: [236-break-down-documents-in-docs-agents.md](../../issues/236-break-down-documents-in-docs-agents.md)

## Overview

Split the four monolithic docs (`frontend.md`, `contributing.md`, `routes.md`, `architecture.md`) into topic-scoped folders with an `index.md` each, extract inlined code snippets into per-folder `examples.md` files, add a short summary to every doc under `docs/agents/` (including the ones left untouched), introduce a single top-level `docs/agents/summary.md` index, and update every file that currently links to the old flat paths.

This is purely a documentation/root-config restructuring — it touches only `docs/agents/`, `AGENTS.md`, and `.claude/agents/*.md`, none of `source/` or `frontend/`, so it stays with the architect (no agent split).

## Context

`AGENTS.md` and the `.claude/agents/*.md` specialist prompts link directly to these docs, so any task that references one pulls the whole file into context. `frontend.md` (278 lines), `contributing.md` (226 lines), `routes.md` (108 lines), and `architecture.md` (89 lines) each cover multiple unrelated topics in one file. `external/*-usage.md` files are out of scope — they mirror their source gems and are split upstream if needed.

## Implementation Steps

### Step 1 — Create `docs/agents/summary.md`

New top-level file: one entry per doc under `docs/agents/` (every `external/*.md`, `folder-structure.md`, `flow.md`, and the new `frontend/index.md`, `contributing/index.md`, `routes/index.md`, `architecture/index.md`), each with a 1-3 sentence summary and a link. This becomes the single index other files point to instead of duplicating a table.

### Step 2 — Split `frontend.md`

Create `docs/agents/frontend/`:
- `index.md` — summary, "Directory Structure", "Pages vs Elements" (orientation content)
- `component-pattern.md` — "Component Architecture" (Component/Controller/Helper), "Adding a New Page", "Adding a New Element", "Routing Utilities"
- `dev-workflow.md` — "Running Locally", "Building for Production", "Tests and Lint", "Docker Setup", "Proxy Modes"
- `linting.md` — "Linting and Inline Documentation"
- `examples.md` — the code snippets currently inlined under Component/Controller/Helper (`component-pattern.md` links out to them instead of inlining)

Delete `docs/agents/frontend.md` once its content has moved.

### Step 3 — Split `contributing.md`

Create `docs/agents/contributing/`:
- `index.md` — summary, "Language Standard", plus a new "Documentation Guidelines" note recording the ~150-line-per-file target for `docs/agents/*` (the future-proofing rule from the issue's Scope section)
- `git-workflow.md` — "Commit Guidelines", "Pull Requests" (PR template), "Definition of Done", "CI Checks"
- `code-style.md` — "Code Organization" (Single Responsibility, Method Order, One Class per File, Small Methods), "Dependency Injection", "Refactoring Guidelines"
- `examples.md` — the Good/Bad code snippets currently inlined in "Code Organization" and "Dependency Injection" (`code-style.md` links out to them)

Delete `docs/agents/contributing.md` once its content has moved.

### Step 4 — Split `routes.md`

Create `docs/agents/routes/`:
- `index.md` — summary
- `resource-routes.md` — Home, Categories, Items, Kinds, Admin — Users, Forbidden
- `utility-routes.md` — Session, User Navigation Data, Form Support, Subscriptions, Disabled/Pending Cleanup

Delete `docs/agents/routes.md` once its content has moved.

### Step 5 — Split `architecture.md`

Create `docs/agents/architecture/`:
- `index.md` — summary, "Overview", "Frontend" (kept short, pointing to `frontend/index.md` for detail)
- `infrastructure.md` — "Infrastructure", "Request Routing"
- `backend-layout.md` — "Source Code Layout", "Key Gems and Their Role", "Template Rendering Pattern"

Delete `docs/agents/architecture.md` once its content has moved.

### Step 6 — Add summaries to the untouched docs

Add a 1-3 sentence summary at the top of `docs/agents/folder-structure.md`, `docs/agents/flow.md`, and each `docs/agents/external/*.md` file, without otherwise restructuring their content.

### Step 7 — Update `AGENTS.md`

- Replace the 4 inline mentions (Architecture, Routes, Contributing, Front-End sections) so they link to the new `index.md` paths instead of the old flat files.
- Replace the doc table with a single link to `docs/agents/summary.md`.

### Step 8 — Update `.claude/agents/*.md` references

- `.claude/agents/architect.md` — replace its own copy of the doc table with a link to `docs/agents/summary.md`.
- `.claude/agents/frontend.md` — update its references to `docs/agents/frontend.md` and `docs/agents/contributing.md` to their new `index.md` paths.
- `.claude/agents/backend.md` — update its reference to `docs/agents/contributing.md` to its new `index.md` path.

### Step 9 — Verify

- Manually click through every link changed in Steps 7-8 to confirm it resolves.
- Confirm no file under `docs/agents/{frontend,contributing,routes,architecture}/` (including `index.md`/`examples.md`) exceeds roughly 150 lines.
- Grep the repo for any remaining reference to the four old flat paths (`docs/agents/frontend.md`, `docs/agents/contributing.md`, `docs/agents/routes.md`, `docs/agents/architecture.md`) to make sure nothing was missed.

## Files to Change

- `docs/agents/summary.md` — new, index of every doc with summary + link
- `docs/agents/frontend.md` — deleted, replaced by `docs/agents/frontend/{index,component-pattern,dev-workflow,linting,examples}.md`
- `docs/agents/contributing.md` — deleted, replaced by `docs/agents/contributing/{index,git-workflow,code-style,examples}.md`
- `docs/agents/routes.md` — deleted, replaced by `docs/agents/routes/{index,resource-routes,utility-routes}.md`
- `docs/agents/architecture.md` — deleted, replaced by `docs/agents/architecture/{index,infrastructure,backend-layout}.md`
- `docs/agents/folder-structure.md` — add summary
- `docs/agents/flow.md` — add summary
- `docs/agents/external/*.md` (sinclair-usage, azeroth-usage, jace-usage, HOW_TO_USE_NAVI, HOW_TO_USE_NAVI-CLIENT, HOW_TO_USE_DARTHJEE-TENT) — add summary only, no split
- `AGENTS.md` — update 4 inline links to new `index.md` paths; replace doc table with a link to `docs/agents/summary.md`
- `.claude/agents/architect.md` — replace doc table with a link to `docs/agents/summary.md`
- `.claude/agents/frontend.md` — update `docs/agents/frontend.md` and `docs/agents/contributing.md` references to their `index.md` paths
- `.claude/agents/backend.md` — update `docs/agents/contributing.md` reference to its `index.md` path

## Notes

- No CI job in `.circleci/config.yml` covers markdown/docs linting, so no `## CI Checks` section applies here.
- `external/*-usage.md` files are explicitly out of scope for splitting — summary-only.
- The ~150-line guideline is recorded as prose in `contributing/index.md`; no automated enforcement is added in this issue.
