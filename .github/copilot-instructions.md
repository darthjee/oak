# Oak Project - GitHub Copilot Instructions

## Project Overview

Oak is a web application catalog to showcase different types of items, including:

- Electronic components
- Painted miniatures
- GitHub projects
- Other catalogable items

## Architecture and Tech Stack

### Backend

- **Ruby on Rails** - Main application server
- **Docker + Docker Compose** - Containerization and orchestration
- Backend and frontend are served by the same Rails application (monolithic architecture, no separation yet)

### Frontend

- **AngularJS** - JavaScript framework for Single Page Application
- **Cyberhawk** (<https://github.com/darthjee/cyberhawk>) - Route and request management

### Main Libraries and Gems

- **Tarquinn** (<https://github.com/darthjee/tarquinn>) - Route management and redirection. See [.github/tarquinn-usage.md](.github/tarquinn-usage.md) for detailed usage patterns.
- **OnePageApplication concern** (<https://github.com/darthjee/oak/blob/main/source/app/controllers/concerns/one_page_application.rb>) - Ensures navigation via anchor
- **Sinclair** (<https://github.com/darthjee/sinclair>) - Dynamic method builder, configuration, options, and model helpers. See [.github/sinclair-usage.md](.github/sinclair-usage.md) for detailed usage patterns.
- **Azeroth** (<https://github.com/darthjee/azeroth>) - Simplifies Rails controller endpoints with `resource_for`. See [.github/azeroth-usage.md](.github/azeroth-usage.md) for detailed usage patterns.
- **Magicka** (<https://github.com/darthjee/magicka>) - Renders AngularJS-compatible form and display elements in ERB templates. See [.github/magicka-usage.md](.github/magicka-usage.md) for detailed usage patterns.

## Request Flow

### Navigation Pattern

1. **Initial access**: User accesses any route (e.g., `/categories`)
2. **Redirection**: Tarquinn + OnePageApplication concern redirect to root with anchor (e.g., `/#/categories`)
3. **SPA Navigation**: All subsequent navigation happens via anchors, without page reload

### Content Loading (AngularJS + Cyberhawk)

When the user navigates to a section:

1. **HTML Template**: Requests the template via AJAX (e.g., `/categories.html?ajax=true`)
2. **JSON Data**: Requests the data via API (e.g., `/categories.json`)
3. **Rendering**: AngularJS combines template + data to build the page

**Complete flow example:**
```
User accesses: /categories
       ↓
Redirected to: /#/categories
       ↓
Cyberhawk intercepts and makes:
  - GET /categories.html?ajax=true (template)
  - GET /categories.json (data)
       ↓
AngularJS renders the page
```

## Development Principles

In order to achieve maintability and readability, we follow these principles:

### Language Standard

- **English only**: All code, PR titles/descriptions, documentation, commit messages, and code comments must be written in English.

### Code and Best Practices

- **Sandi Metz principles**: We follow Sandi Metz rules for object-oriented design
  - Classes with max 100 lines
  - Methods with max 5 lines
  - Pass max 4 parameters
  - Controllers instantiate only one object
- **Understandable code**: Priority for clarity and maintainability over "clever code"
- **RuboCop**: Mandatory linter for style consistency
- **Tests**: Robust test coverage is fundamental

### When Suggesting Code

1. Keep methods small and focused (max 5 lines when possible)
2. Extract complex logic to service classes or builders
3. Use decorators for presentation logic
4. Suggest tests along with implementations
5. Follow RuboCop conventions
6. Prefer readability over premature optimization

## Project Structure

Is organized in a way that reflects the Rails conventions while also accommodating the SPA architecture and containerization setup.

### Main Directories

- `source/` - Rails application source code
  - `app/controllers/` - Rails controllers
  - `app/models/` - ActiveRecord models
  - `app/builders/` - Classes for building complex objects
  - `app/decorators/` - Decorators for presentation logic
  - `app/views/` - ERB templates and partials
  - `app/assets/` - Assets (CSS, JavaScript, images)
  - `spec/` - RSpec tests
- `docker-compose.yml` - Container orchestration
- `dockerfiles/` - Docker image definitions (one subdirectory per image)

### Containerization

- Use `docker-compose` to start the environment
- Persistent volumes for MySQL in `docker_volumes/mysql_data/`
- Development public files in `dev_public_files/`
- Production public files in `prod_public_files/`

## Sinclair Usage

Oak uses the **sinclair** gem extensively. Refer to [.github/sinclair-usage.md](.github/sinclair-usage.md) for the full usage guide.

Key features used in this project:

- **`Sinclair`** – Dynamically add instance/class methods to existing classes via builders
- **`Sinclair::Model`** – Quick plain-Ruby models with keyword initializers and equality support
- **`Sinclair::Options`** – Validated option/parameter objects with defaults
- **`Sinclair::Configurable`** – Read-only application configuration with defaults
- **`Sinclair::Comparable`** – Attribute-based `==` for models
- **`Sinclair::Matchers`** – RSpec matchers to test builder behaviour (`add_method`, `add_class_method`, `change_method`)

When building new features, prefer sinclair patterns for dynamic method generation, option handling, and plain-Ruby models over raw `attr_accessor` / `define_method` approaches.

## Azeroth Usage

Oak uses the **azeroth** gem for Rails controller endpoints. Refer to [.github/azeroth-usage.md](.github/azeroth-usage.md) for the full usage guide.

Key features used in this project:

- **`resource_for`** – Generates standard CRUD actions (`create`, `show`, `index`, `update`, `delete`, `edit`) for a resource, handling both HTML and JSON formats transparently
- **`model_for`** – Adds resource accessor methods to a controller without generating HTTP actions; useful for parent/context resources
- **`Azeroth::Decorator`** – Controls JSON serialization by exposing selected attributes via `expose`

When building new controller endpoints for standard resources, prefer `resource_for` over hand-written CRUD actions to ensure consistent behavior.

## Magicka Usage

Oak uses the **magicka** gem to render AngularJS-compatible form and display elements inside ERB templates. Refer to [.github/magicka-usage.md](.github/magicka-usage.md) for the full usage guide.

Key features used in this project:

- **`magicka_form(model)`** – Yields a form builder for new/edit views; elements are bound via `ng-model` and show validation errors.
- **`magicka_display(model)`** – Yields a read-only display builder for show views.
- **`form.only(:form)` / `form.only(:display)`** – Conditionally renders content based on whether the context is a form (new/edit) or a display (show).
- **Built-in elements** – `input`, `textarea`, `select`, `ng_select`, `text`, `ng_select_text`, `pagination`, `button`.
- **Custom elements** – Extend `Magicka::Input`, `Magicka::Select`, `Magicka::Text`, or `Magicka::Element` and create the corresponding ERB template partial.

When adding fields to views, prefer Magicka's built-in elements before creating new ones. Shared form partials (`_form.html.erb`) are used across `new`, `edit`, and `show` views using `form.only` to differentiate context.

## Tarquinn Usage

Oak uses the **tarquinn** gem for controller-level redirections. Refer to [.github/tarquinn-usage.md](.github/tarquinn-usage.md) for the full usage guide.

Key features used in this project:

- **`redirection_rule`** – Declares a redirect with one or more condition methods (or a block); fires when any condition is truthy
- **`skip_redirection_rule`** – Prevents an inherited rule from firing when a condition is truthy
- **`skip_redirection`** – Bypasses a rule for specific controller actions

When adding new redirection logic, prefer `redirection_rule` in base controllers and use `skip_redirection_rule` / `skip_redirection` in child controllers to override inherited rules.

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

Frontend is served from the same Rails app, so all templates and assets are managed within the Rails structure. AngularJS handles the dynamic rendering and Cyberhawk manages the request lifecycle for templates and data.

### AngularJS + Cyberhawk

- Routes defined with anchors (`#/path`)
- Templates loaded via AJAX with `?ajax=true` parameter
- Data loaded via `.json` endpoints
- Cyberhawk manages the request lifecycle

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
2. **HTML templates must respond to `?ajax=true`**: To be loaded by the frontend
3. **APIs must have JSON version**: Controllers must respond to JSON format
4. **Run `make setup` before `docker-compose up`**: This is mandatory for local bootstrap and it generates `.env` from `.env.example`
5. **Test everything**: Don't suggest code without corresponding tests
6. **Clean RuboCop**: Code must pass RuboCop before commit
7. **Follow Sandi Metz**: Question if classes/methods are getting too large

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

### 4. Update the Views with Magicka

Refer to [.github/magicka-usage.md](.github/magicka-usage.md) for the full Magicka reference.

Views are typically organised as:

| File | Purpose |
|---|---|
| `new.html.erb` | Renders `magicka_form` and delegates to `_form.html.erb` |
| `edit.html.erb` | Same as `new.html.erb` |
| `show.html.erb` | Renders `magicka_display` and delegates to `_form.html.erb` |
| `_form.html.erb` | Shared partial used by all three views above |
| `index.html.erb` | List view — usually shows a subset of fields |

#### Adding a plain text / string field

```erb
<%# _form.html.erb %>
<div class="form-group">
  <%= form.input(:status, placeholder: "Status", class: "form-control") %>
</div>
```

#### Adding a textarea field

```erb
<div class="form-group">
  <%= form.textarea(:bio, placeholder: "Short bio", class: "form-control") %>
</div>
```

#### Adding a foreign-key select (AngularJS list)

Use `form.only(:form)` for the editable select and `form.only(:display)` for the read-only version:

```erb
<%# Editable select — shown only in new/edit %>
<%= form.only(:form) do
  form.ng_select(
    :status,
    options: "gnc.statuses",
    reference_key: :value,
    text_field: :label,
    ng_errors: "gnc.data.errors.status",
    class: "form-control"
  )
end %>

<%# Read-only display — shown only in show %>
<%= form.only(:display) do
  form.input("status", label: "Status", class: "form-control-plaintext")
end %>
```

#### Adding a field to the index view

The index view (`index.html.erb`) uses raw AngularJS expressions — add a new column or card field directly:

```erb
<p>{{item.status}}</p>
```

### 5. Update the Decorator (JSON Serialization)

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

Refer to [.github/azeroth-usage.md](.github/azeroth-usage.md) for the full decorator reference.

### 6. Creating a New Magicka Element (if needed)

If the new field type is not covered by the built-in Magicka elements (e.g., a star-rating widget, a date-picker, a rich-text editor), create a custom element:

1. **Model** in `app/models/magicka/my_element.rb` — extend an appropriate base class and declare extra locals with `with_attribute_locals`.
2. **Template** in `app/views/templates/forms/_my_element.html.erb` (or `templates/display/`) — write the ERB/HTML that uses the declared locals.

See [.github/magicka-usage.md](.github/magicka-usage.md#creating-a-new-magicka-element) for a step-by-step example.

### Checklist

- [ ] Migration created and run (`rails db:migrate`)
- [ ] `source/db/schema.rb` updated
- [ ] Model validations added/updated
- [ ] Controller `permit` list updated
- [ ] Views updated with Magicka elements (`_form.html.erb`, `index.html.erb`)
- [ ] Decorator updated if the field must appear in JSON responses
- [ ] New Magicka element created if no built-in element is suitable
- [ ] RSpec tests written for model, controller, and decorator changes
- [ ] RuboCop passes with no new offences

## Important Notes

- Navigation ALWAYS goes through root with anchor (never direct route access)
- AngularJS is legacy but it's what we currently use
- Prioritize readability and testability over other considerations
- Builders and Decorators are preferred for complex logic outside models
