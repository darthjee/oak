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

## Important Notes

- Navigation ALWAYS goes through root with anchor (never direct route access)
- AngularJS is legacy but it's what we currently use
- Prioritize readability and testability over other considerations
- Builders and Decorators are preferred for complex logic outside models
