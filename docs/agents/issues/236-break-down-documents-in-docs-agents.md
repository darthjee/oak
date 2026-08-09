# Issue: Break down documents in docs/agents

## Description

Documents under `docs/agents/` are the primary context every agent (and `AGENTS.md` itself) reads to work on this project. Several of them have grown monolithic, so any task that touches one pulls in far more content — and more tokens — than the task actually needs. This issue restructures the largest docs into topic-scoped files with per-file summaries, so agents can judge relevance and open only what's needed.

## Problem

- `docs/agents/frontend.md`, `contributing.md`, `routes.md`, and `architecture.md` each mix multiple unrelated topics in one file (e.g. `frontend.md` covers dev workflow, component patterns, Docker setup, and linting all together), so a task needing just one topic still pays for the whole file.
- `AGENTS.md`'s doc table gives only a title-fragment description per file, not enough for an agent to rule a file out as irrelevant without opening it.
- Code examples are inlined alongside guidance/prose, inflating files that are mostly narrative.

## Solution

### Scope

- `docs/agents/external/*-usage.md` (sinclair, azeroth, jace, navi, darthjee-tent) are **out of scope** — they are generated/maintained from their source gems/projects; splitting them happens upstream, not here.
- Files to split now: `docs/agents/frontend.md`, `docs/agents/contributing.md`, `docs/agents/routes.md`, `docs/agents/architecture.md`.
- Beyond the one-time restructuring, this issue also introduces a general guideline so future docs don't regrow into monoliths — see the line-count target under Performance below. It's written down as a short "Documentation Guidelines" note in `contributing/index.md`, since that's the doc every contributor already lands on for project conventions.

### Structural breakdown

Each split doc becomes a folder with an `index.md` (summary + links to its siblings), mirroring the existing `docs/agents/plans/<issue_id>_<topic>/` convention:

```
docs/agents/
  summary.md               # index of every docs/agents/* file, with its summary + link
  frontend/
    index.md              # summary, Directory Structure, Pages vs Elements
    component-pattern.md  # Component Architecture, Adding a New Page/Element, Routing Utilities
    dev-workflow.md       # Running Locally, Building for Production, Tests and Lint, Docker Setup, Proxy Modes
    linting.md            # Linting and Inline Documentation
    examples.md           # component/controller/helper code snippets
  contributing/
    index.md              # summary, Language Standard
    git-workflow.md        # Commit Guidelines, Pull Requests/PR template, Definition of Done, CI Checks
    code-style.md          # Code Organization, Dependency Injection, Refactoring Guidelines
    examples.md            # Good/Bad code snippets referenced by code-style.md
  routes/
    index.md               # summary
    resource-routes.md     # Home, Categories, Items, Kinds, Admin — Users, Forbidden
    utility-routes.md      # Session, User Navigation Data, Form Support, Subscriptions, Disabled/Pending Cleanup
  architecture/
    index.md               # summary, Overview, Frontend (pointer to frontend/index.md)
    infrastructure.md      # Infrastructure, Request Routing
    backend-layout.md      # Source Code Layout, Key Gems, Template Rendering Pattern
```

Each split doc folder also gets its own `examples.md` holding the actual code snippets; the topic files (`code-style.md`, `component-pattern.md`, etc.) keep prose/guidance and link out to the relevant snippet instead of inlining it.

### Summaries

- Every file under `docs/agents/` gets a summary — not just the four being split — including `folder-structure.md`, `flow.md`, and the untouched `external/*-usage.md` files.
- A short (1-3 sentence) summary goes at the top of each doc (or each `index.md` for the split docs).
- A new top-level `docs/agents/summary.md` becomes the single index of every doc under `docs/agents/`: one entry per doc with its summary + link.
- `AGENTS.md` links to `summary.md` instead of maintaining its own inline doc table, and links to each `index.md` wherever it currently references one of the four split docs directly (Front-End/Contributing/Routes/Architecture sections). Removing the duplicated table also shrinks `AGENTS.md` itself.
- `.claude/agents/architect.md` likewise stops duplicating the table and links to `docs/agents/summary.md`.

### Updating references

- `AGENTS.md` — 4 inline mentions (Architecture, Routes, Contributing, Front-End sections) update to the new `index.md` paths; its doc table is replaced by a link to `docs/agents/summary.md`.
- `.claude/agents/architect.md` — its own copy of the doc table is replaced by a link to `docs/agents/summary.md`.
- `.claude/agents/frontend.md` — references to `docs/agents/frontend.md` and `docs/agents/contributing.md` update to their `index.md` paths.
- `.claude/agents/backend.md` — reference to `docs/agents/contributing.md` updates to its `index.md` path.
- No CI config or other files were found referencing these paths.

### Alternatives considered

- **Trim instead of split** — rejected: doesn't let an agent skip an entire irrelevant topic (e.g. a backend task would still pay for Docker/proxy content in `frontend.md`).
- **Auto-generated summaries** — rejected for now: summaries are hand-written and reviewed like any other doc change; no automated sync step.

### Performance & security

- Security: not applicable — plain markdown docs, no secrets or auth surface involved.
- Performance is the point of this issue, made concrete as an acceptance criterion: after splitting, no individual file under `docs/agents/{frontend,contributing,routes,architecture}/` (or their `examples.md`/`index.md`) exceeds roughly 150 lines. This number also doubles as the future-proofing threshold for new docs.

### Verification

No new tooling is added for this. The PR reviewer manually:
- Clicks through every changed link (`AGENTS.md`, `.claude/agents/architect.md`, `.claude/agents/frontend.md`, `.claude/agents/backend.md`) to confirm it resolves to the right file.
- Checks that no split file exceeds the ~150-line target.

## Benefits

- Agents pull in only the topic file relevant to their task instead of an entire multi-topic doc, cutting token usage per task.
- `docs/agents/summary.md` gives a single, compact place to judge relevance without opening any doc.
- Extracting code snippets into `examples.md` keeps guidance files focused on prose, opened only when a snippet is actually needed.
- The ~150-line guideline prevents future docs from regrowing into monoliths.
