# Contributing

Project-wide conventions for contributing to Oak: language standard, git/PR workflow, code style, and documentation guidelines. See the linked pages for the full detail on each topic.

- [Git Workflow](git-workflow.md) — commit guidelines, PR template, definition of done, CI checks.
- [Code Style](code-style.md) — code organization, dependency injection, refactoring guidelines.
- [Examples](examples.md) — good/bad code snippets referenced by `code-style.md`.

---

## Language Standard

- **English only:** All code, PR titles/descriptions, documentation, commit messages, and code comments must be written in English.

---

## Documentation Guidelines

Docs under `docs/agents/` are the primary context every agent reads to work on this project — keep individual files topic-scoped so a task only pays for what it needs:

- No file under `docs/agents/` (or its split subfolders' `index.md`/`examples.md`) should exceed roughly **150 lines**. Split a growing file into a folder with an `index.md` + topic files, following the pattern already used by `frontend/`, `contributing/`, `routes/`, and `architecture/`.
- Every doc gets a short (1-3 sentence) summary at the top, and an entry in [`docs/agents/summary.md`](../summary.md).
- Keep code snippets in a sibling `examples.md` when a topic file is mostly prose/guidance — link out to the snippet instead of inlining it.
