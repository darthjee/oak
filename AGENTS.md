# Oak Project - GitHub Copilot Instructions

## Project Overview

Oak is a web application catalog to showcase different types of items, including:

- Electronic components
- Painted miniatures
- GitHub projects
- Other catalogable items

## Architecture and Tech Stack

See [architecture.md](docs/agents/architecture.md) for the full details on backend, frontend, and main libraries.

## Request Flow

See [flow.md](docs/agents/flow.md) for the full details on navigation pattern and content loading.

## Routes

See [routes.md](docs/agents/routes.md) for the full list of resource and utility routes.

## Contributing

See [contributing.md](docs/agents/contributing.md) for the full details on language standards, best practices, and code guidelines.

## Sinclair Usage

Oak uses the **sinclair** gem extensively. Refer to [sinclair-usage.md](docs/agents/external/sinclair-usage.md) for the full usage guide.

Key features used in this project:

- **`Sinclair`** – Dynamically add instance/class methods to existing classes via builders
- **`Sinclair::Model`** – Quick plain-Ruby models with keyword initializers and equality support
- **`Sinclair::Options`** – Validated option/parameter objects with defaults
- **`Sinclair::Configurable`** – Read-only application configuration with defaults
- **`Sinclair::Comparable`** – Attribute-based `==` for models
- **`Sinclair::Matchers`** – RSpec matchers to test builder behaviour (`add_method`, `add_class_method`, `change_method`)

When building new features, prefer sinclair patterns for dynamic method generation, option handling, and plain-Ruby models over raw `attr_accessor` / `define_method` approaches.

## Azeroth Usage

Oak uses the **azeroth** gem for Rails controller endpoints. Refer to [azeroth-usage.md](docs/agents/external/azeroth-usage.md) for the full usage guide.

Key features used in this project:

- **`resource_for`** – Generates standard CRUD actions (`create`, `show`, `index`, `update`, `delete`, `edit`) for a resource, handling both HTML and JSON formats transparently
- **`model_for`** – Adds resource accessor methods to a controller without generating HTTP actions; useful for parent/context resources
- **`Azeroth::Decorator`** – Controls JSON serialization by exposing selected attributes via `expose`

When building new controller endpoints for standard resources, prefer `resource_for` over hand-written CRUD actions to ensure consistent behavior.

## Jace Usage

Oak uses the **jace** gem for internal event-driven logic. Refer to [jace-usage.md](docs/agents/external/jace-usage.md) for the full usage guide.

Key features used in this project:

- **`Jace::Registry`** – Central object that stores event-to-handler mappings; instantiate once per service/module
- **`registry.register(event, instant = :after, &block)`** – Adds a `before` or `after` handler for a named event; handlers are `instance_eval`'d inside the trigger context
- **`registry.trigger(event, context, &block)`** – Fires the named event, running `:before` handlers, the main block, then `:after` handlers

When implementing lifecycle hooks or side-effects for service operations (e.g. logging, notifications, validations), prefer a `Jace::Registry` over ad-hoc callbacks or observer patterns.

## Controller Patterns

Controllers should use the `OnePageApplication` concern to ensure SPA behavior:
```ruby
class CategoriesController < ApplicationController
  include OnePageApplication
  
  # Responds to /categories.html?ajax=true
  # Responds to /categories.json
end
```

## Frontend Patterns

`source/` is a pure JSON API — it no longer renders any application page. The frontend is a separate React + Vite SPA in `frontend/`. See [frontend.md](docs/agents/frontend.md) for its component pattern, routing, and Docker/proxy setup.

- Routes defined with anchors (`#/path`)
- Data loaded via `.json` endpoints served by `source/`

## Useful Docker Commands

```bash
# Bootstrap app first (creates .env, installs dependencies, prepares database)
make setup

# Start the environment (run only after make setup)
docker-compose up

# Access the Rails container
docker-compose exec oak_app bash

# Run tests
docker-compose exec oak_app bundle exec rspec

# Run RuboCop
docker-compose exec oak_app bundle exec rubocop
```

## When Working on This Project

1. **Always consider the SPA flow**: Route changes must respect the redirection pattern
2. **APIs must have JSON version**: Controllers must respond to JSON format
3. **Run `make setup` before `docker-compose up`**: This is mandatory for local bootstrap and it generates `.env` from `.env.example`
4. **Test everything**: Don't suggest code without corresponding tests
5. **Clean RuboCop**: Code must pass RuboCop before commit
6. **Follow Sandi Metz**: Question if classes/methods are getting too large

## Adding a Field to an ActiveRecord Model

Follow these steps whenever you need to add a new attribute to an existing model.

### 1. Generate the Migration

Create a migration to add the column to the database table. Run the generator inside the container and then inspect the generated file:

```bash
docker-compose exec oak_app bundle exec rails generate migration AddFieldNameToTableName field_name:type
```

Edit the generated file in `source/db/migrate/` as needed. Examples:

```ruby
# Adding a nullable text column
class AddBioToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :bio, :text, null: true
  end
end
```

```ruby
# Adding a non-nullable string column with a default
class AddStatusToItems < ActiveRecord::Migration[7.2]
  def change
    add_column :items, :status, :string, null: false, default: 'draft', limit: 20
  end
end
```

```ruby
# Adding an integer column with a limit (e.g. smallint)
class AddRatingToItems < ActiveRecord::Migration[7.2]
  def change
    add_column :items, :rating, :integer, default: 0, limit: 2, null: false
  end
end
```

Run the migration:

```bash
docker-compose exec oak_app bundle exec rails db:migrate
```

This will update `source/db/schema.rb` automatically.

### 2. Update the Model

Add validations for the new field in the model class. Follow the existing validation patterns:

```ruby
# app/models/oak/item.rb
module Oak
  class Item < ApplicationRecord
    # existing validations ...
    validates :status, presence: true, length: { maximum: 20 },
                       inclusion: { in: %w[draft published archived] }
  end
end
```

Common validation helpers:

| Use case | Validation |
|---|---|
| Required string | `validates :field, presence: true, length: { maximum: N }` |
| Optional text | `validates :field, length: { maximum: N }, allow_nil: true` |
| Integer range | `validates :field, numericality: { only_integer: true, greater_than_or_equal_to: X, less_than_or_equal_to: Y }` |
| Allowed values | `validates :field, inclusion: { in: %w[a b c] }` |

### 3. Update the Controller — Strong Parameters

Add the new field to the `permit` list in the controller's private `*_params` method so it is accepted during `create` and `update`:

```ruby
# app/controllers/items_controller.rb
def item_params
  params
    .require(:item)
    .permit(:name, :description, :status, links: %i[id url text order])
    .merge(category:, kind:)
end
```

If the field is a nested attribute or an array, include the appropriate structure in `permit`:

```ruby
# Scalar field
.permit(:name, :description, :status)

# Array of scalars
.permit(:name, tags: [])

# Array of hashes (nested records)
.permit(:name, links: %i[id url text order])
```

### 4. Update the Decorator (JSON Serialization)

If the field should be returned by the JSON API, expose it in the relevant decorator:

```ruby
# app/decorators/oak/item/decorator.rb
class Oak::Item::Decorator < Azeroth::Decorator
  expose :id
  expose :name
  expose :description
  expose :status   # ← add the new field here
end
```

Refer to [azeroth-usage.md](docs/agents/external/azeroth-usage.md) for the full decorator reference.

### Checklist

- [ ] Migration created and run (`rails db:migrate`)
- [ ] `source/db/schema.rb` updated
- [ ] Model validations added/updated
- [ ] Controller `permit` list updated
- [ ] Decorator updated if the field must appear in JSON responses
- [ ] RSpec tests written for model, controller, and decorator changes
- [ ] RuboCop passes with no new offences

## Important Notes

- Navigation ALWAYS goes through root with anchor (never direct route access)
- Prioritize readability and testability over other considerations
- Builders and Decorators are preferred for complex logic outside models

## Documentation

All project documentation lives under [`docs/agents/`](docs/agents/):

| File | Contents |
|------|----------|
| [Folder Structure](docs/agents/folder-structure.md) | Top-level directory layout and the role of each folder. |
| [Architecture](docs/agents/architecture.md) | Infrastructure, source layout, request routing, gems, and template patterns. |
| [Contributing](docs/agents/contributing.md) | Commit guidelines, PR template, definition of done, and CI checks. |
| [Flow](docs/agents/flow.md) | Main runtime flow of the application. |
| [Routes](docs/agents/routes.md) | Full list of resource and utility routes, with descriptions. |
| [Plans](docs/agents/plans/) | Implementation plans for ongoing or upcoming features. |
| [Issues](docs/agents/issues/) | Detailed specs for open issues. |
| [HOW_TO_USE_NAVI](docs/agents/external/HOW_TO_USE_NAVI.md) | Steps for cache warm-up after a release; used to populate `.circleci/config.yml`. |
| [HOW_TO_USE_DARTHJEE-TENT](docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md) | Full reference for the darthjee/tent reverse proxy: Docker setup, rule/matcher/middleware configuration, cache modes, and frontend dev-mode flip. |
| [Front-End](docs/agents/frontend.md) | React + Vite front-end architecture, component pattern (component / controller / helper), Docker setup, and proxy modes. |

### Issues (`docs/agents/issues/`)

Each file documents an issue in detail. Naming convention:

```
docs/agents/issues/<issue_id>_<issue_name>.md
```

Example: `docs/agents/issues/5_release_docker_image.md` for issue #5.

### Plans (`docs/agents/plans/`)

Each plan is a directory named after the issue ID and topic, containing one or more related files:

```
docs/agents/plans/<issue_id>_<topic>/<related_files>.md
```

Example: `docs/agents/plans/12_add-auth/plan.md` for issue #12.
