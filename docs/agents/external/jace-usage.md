# Using the Jace Gem

## What is Jace?

**Jace** is a Ruby gem for event-driven development **within a single application**.
It is not about distributed architecture or message queues — it is about building
internal event-oriented logic inside a Ruby gem or application.

With Jace, you register handlers for named events and trigger those events from
anywhere in your codebase. When an event is triggered, Jace executes the registered
`before` handlers (inside the context via `instance_eval`), then the main block,
then the `after` handlers (also inside the context via `instance_eval`).

---

## Guide

- [Installation](jace/installation.md)
- [Core Concepts](jace/core-concepts.md) — `Jace::Registry`, `register`, `trigger`
- [Basic Usage](jace/basic-usage.md)
- [Handlers](jace/handlers.md) — handler types, multiple handlers per event, edge cases
- [Typical Integration Pattern](jace/integration-pattern.md)
- [Execution Model](jace/execution-model.md)
- [API Reference](jace/api-reference.md)
