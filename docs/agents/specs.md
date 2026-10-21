# Specs

Permanent hub for features that are being developed or planned. **This file is never deleted.**

A spec is a temporary design document tied to one Epic. The Epic's sub-issues implement against
it, so backend and frontend work can run in parallel on one fixed contract. Once the Epic is done,
the spec is removed.

## Layout

Every spec uses the same three levels:

| Level | Path | Role |
|---|---|---|
| Hub | `docs/agents/specs.md` | This file. Lists the active features. |
| Feature hub | `docs/agents/specs/<feature>.md` | Indexes the topic files and maps each sub-issue to the topic files it uses. |
| Topic files | `docs/agents/specs/<feature>/*.md` | One topic each (flow, data model, HTTP contract, UI, ...). |

## Rules

- **Every spec must be split** as above, never one large file. Each file stays under the
  ~150-line target from [contributing/index.md](contributing/index.md). If a topic file grows past
  that, split it and update the feature hub's index.
- **Specify exactly what two sub-issues must agree on** (endpoint paths, JSON shapes, status
  codes, status values, setting names and defaults, event names, routes). Leave anything owned by
  a single sub-issue (class names, file layout, UI copy, test layout) to that sub-issue's plan.
- **Self-contained.** A spec must not depend on files outside the repository. External reference
  material is read while writing the spec and copied into it, adapted to Oak.

## Lifecycle

1. **The Epic's first issue** writes `specs/<feature>.md` and `specs/<feature>/*.md`, and adds the
   feature's row to the table below.
2. **Implementing issues** update the spec whenever the implementation has to deviate from it, in
   the same PR as the deviation.
3. **The Epic's last issue** deletes `specs/<feature>.md`, `specs/<feature>/` and the feature's
   row below. It **may** copy lasting parts (routes, settings, architecture, frontend patterns)
   into the permanent docs when that makes sense. This is a judgment call, not a requirement.

When no feature is active, the table below is replaced by the line "No active specs."

## Active specs

No active specs.
