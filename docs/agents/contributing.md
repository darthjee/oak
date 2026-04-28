# Contributing

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
- Code coverage is as high as reasonably possible.
- Code is not overly complex:
  - Follow **Sandi Metz rules**: classes ≤ 100 lines, methods ≤ 5 lines, max 4 parameters, controllers instantiate only one object.
  - Classes and methods have clear, focused responsibilities. If a class or method is taking on too many responsibilities, refactor to simplify.
  - *Example (Ruby):*
    ```ruby
    # Good: each method does one thing
    class Item
      def publish   = update!(status: :published)
      def unpublish = update!(status: :draft)
    end

    # Bad: method does too much
    class Item
      def publish
        update!(status: :published)
        notify_subscribers
        expire_cache
        log_event
      end
    end
    ```
  - This requirement applies primarily to source code. For specs, refactor only if there is excessive duplication.

### CI Checks

Before a PR is considered complete, all CI checks must pass locally:

| CircleCI job | What it runs | Local command |
|--------------|--------------|---------------|
| `test` | RSpec + coverage | `docker-compose exec oak_app bundle exec rspec` |
| `checks` | RuboCop | `docker-compose exec oak_app bundle exec rubocop` |

Both jobs must pass before merging any changes to `source/`.

## Language Standard

- **English only:** All code, PR titles/descriptions, documentation, commit messages, and code comments must be written in English.

## Code Organization

### Single Responsibility

Every class must have one clear responsibility. If a class is hard to name or describe without using "and", it is doing too much.

Prefer extracting logic into:
- **Builders** (`app/builders/`) — complex object construction.
- **Decorators** (`app/decorators/`) — presentation/serialization logic.
- **Service objects / utils** (`app/utils/`) — standalone business operations.

### Method Order: Public Before Private

Within a class, **public methods must be declared before private methods**. Private methods serve as implementation helpers and belong at the end of the class body.

```ruby
# Good
class ItemPublisher
  def call
    publish
    notify
  end

  private

  def publish = item.update!(status: :published)
  def notify  = NotificationJob.perform_later(item)
end

# Bad: private methods mixed in with public ones
class ItemPublisher
  def call = publish

  private

  def publish = item.update!(status: :published)

  public

  def notify = NotificationJob.perform_later(item)
end
```

### One Class per File

Each file should define exactly one class or module. The file name must match the class name following Rails conventions (snake_case path → CamelCase constant).

*Example:* `app/builders/oak/item_builder.rb` → `Oak::ItemBuilder`

### Small Methods

Methods should do one thing and stay within 5 lines when possible. If a method is growing, extract the excess into focused private helper methods.

## Refactoring Guidelines

When refactoring, aim to:

- **Reduce duplication:** Move repeated logic to shared methods, concerns, or base classes.
  ```ruby
  # Good: shared lookup extracted
  def category
    @category ||= Category.find_by!(slug: params[:category_slug])
  end

  # Bad: repeated in every action
  def show
    category = Category.find_by!(slug: params[:category_slug])
    ...
  end
  ```

- **Keep specs green throughout:** Each intermediate commit during a refactor must leave the test suite passing.
- **Do not mix refactoring with feature changes:** A refactoring commit must not change observable behaviour.
