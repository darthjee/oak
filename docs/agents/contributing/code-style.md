# Code Style

Backend code organization conventions, dependency injection, and refactoring guidelines. Code snippets referenced below live in [examples.md](examples.md).

## Code Organization

### Single Responsibility

Every class must have one clear responsibility. If a class is hard to name or describe without using "and", it is doing too much.

Prefer extracting logic into:

- **Builders** (`app/builders/`) — complex object construction.
- **Decorators** (`app/decorators/`) — presentation/serialization logic.
- **Service objects / utils** (`app/utils/`) — standalone business operations.

### Method Order: Public Before Private

Within a class, **public methods must be declared before private methods**. Private methods serve as implementation helpers and belong at the end of the class body. See [examples.md](examples.md#method-order-public-before-private).

### One Class per File

Each file should define exactly one class or module. The file name must match the class name following Rails conventions (snake_case path → CamelCase constant).

*Example:* `app/builders/oak/item_builder.rb` → `Oak::ItemBuilder`

### Small Methods

Methods should do one thing and stay within 5 lines when possible. If a method is growing, extract the excess into focused private helper methods.

---

## Dependency Injection

Classes must receive their dependencies (collaborators, configuration, data) as initializer arguments. A class must never reach out to load files, read environment variables, or query global state on its own.

This makes every class independently testable: tests simply instantiate the class with the data they need, without touching the filesystem or environment. See [examples.md](examples.md#dependency-injection).

This principle applies to all classes — including builders and decorators. If a class needs data or a collaborator, it gets it through its initializer.

---

## Refactoring Guidelines

When refactoring, aim to:

- **Reduce duplication:** Move repeated logic to shared methods, concerns, or base classes. See [examples.md](examples.md#reducing-duplication).
- **Keep specs green throughout:** Each intermediate commit during a refactor must leave the test suite passing.
- **Do not mix refactoring with feature changes:** A refactoring commit must not change observable behaviour.
