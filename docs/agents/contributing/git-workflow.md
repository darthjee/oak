# Git Workflow

Commit guidelines, the PR description template, the definition of done, and the CI checks a PR must pass locally before merging.

## Commit Guidelines

- **Atomic and Unitary:** Each commit must represent a single logical change.
  *Example:*
  - Good: `Add slug validation to Category model`
  - Bad: `Add slug validation and refactor ItemsController`
- **No Unrelated Changes:** Do not mix unrelated changes in the same commit.
- **Separate Refactoring:** Whenever possible, separate refactoring commits from new feature or bugfix commits.

## Pull Requests

- **Descriptive Summary:** Every PR must include a clear and descriptive summary of its purpose and changes.
- **PR Description Files:** If a description cannot be provided directly in the PR, generate a file with the PR description (e.g., `docs/agents/issues/<pr_number>_description.md`), but do not commit this file.

### PR Description Template

Every PR description must follow this structure:

```markdown
## Issue

Brief description of the problem or requirement this PR addresses.
Reference the GitHub issue number if applicable (e.g., "Fixes #123").

## Solution

Brief description of the approach taken to solve the issue.
Focus on *what* was done and *why* this approach was chosen.

## Details

Any additional information that helps reviewers understand the changes:
- Notable implementation decisions
- Trade-offs considered
- Areas that may need extra attention
- Testing notes or edge cases covered

Omit this section if there is nothing relevant to add.
```

**Example:**

```markdown
## Issue

`ItemsController` was duplicating the category lookup in every action.
Fixes #87.

## Solution

Extracted the repeated `Category.find_by(slug:)` call into a private
`category` method memoized with `||=`, and used `model_for` from Azeroth
to expose it to the controller.

## Details

No behaviour was changed — this is a pure refactor. All existing request
specs continue to pass without modification.
```

### Definition of Done

A PR is considered complete when:

- The stated objective has been achieved.
- All RSpec tests are passing.
- RuboCop passes with no new offences.
- All Jasmine (frontend) tests are passing.
- ESLint passes with no new offences.
- Code coverage is as high as reasonably possible.
- Code is not overly complex:
  - Follow **Sandi Metz rules**: classes ≤ 100 lines, methods ≤ 5 lines, max 4 parameters, controllers instantiate only one object.
  - Classes and methods have clear, focused responsibilities. If a class or method is taking on too many responsibilities, refactor to simplify.
  - See [examples.md](examples.md#sandi-metz-rules) for a good/bad example.
  - This requirement applies primarily to source code. For specs, refactor only if there is excessive duplication.

### CI Checks

Before a PR is considered complete, all CI checks must pass locally:

| CircleCI job | What it runs | Local command |
|--------------|--------------|---------------|
| `test` | RSpec + coverage | `docker-compose exec oak_app bundle exec rspec` |
| `checks` | RuboCop | `docker-compose exec oak_app bundle exec rubocop` |
| `jasmine` | Jasmine + coverage (frontend) | `docker-compose run --rm oak_fe npm run coverage` |
| `frontend-checks` | ESLint (frontend) | `docker-compose run --rm oak_fe npm run lint` |

All jobs must pass before merging. Use `exec` when the container is already running, or `run --rm` to start a one-off container.
