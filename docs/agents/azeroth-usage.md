# Azeroth Gem Usage Instructions

This file provides guidance for GitHub Copilot when working in projects that use the [Azeroth](https://github.com/darthjee/azeroth) gem.

## About Azeroth

Azeroth is a Ruby gem that simplifies the creation of Rails controller endpoints. Its main feature is the `resource_for` class method, which automatically generates controller action methods (`create`, `show`, `index`, `update`, `delete`, `edit`) and handles both HTML and JSON request formats transparently.

- HTML requests render templates without performing database operations.
- JSON requests perform database operations and return serialized JSON.

## Installation

Add Azeroth to your `Gemfile`:

```ruby
gem 'azeroth'
```

Then run:

```bash
bundle install
```

## Basic Usage

### Setting Up `resource_for`

Include `Azeroth::Resourceable` in your controller and call `resource_for` with the resource name:

```ruby
class PublishersController < ApplicationController
  include Azeroth::Resourceable
  skip_before_action :verify_authenticity_token

  resource_for :publisher, only: %i[create index]
end
```

This generates the following behavior:
- `GET /publishers` → calls `index`, returns all publishers
- `POST /publishers` → calls `create`, creates a new publisher

### Available Actions

By default, `resource_for` builds all six standard actions: `create`, `show`, `index`, `update`, `delete`, and `edit`. Use `only:` or `except:` to restrict which actions are generated:

```ruby
# Only generate index and show
resource_for :article, only: %i[index show]

# Generate everything except delete
resource_for :article, except: :delete
```

### Nested Resources

Override the collection method to scope resources to a parent:

```ruby
class GamesController < ApplicationController
  include Azeroth::Resourceable
  skip_before_action :verify_authenticity_token

  resource_for :game, except: :delete

  private

  def games
    publisher.games
  end

  def publisher
    @publisher ||= Publisher.find(publisher_id)
  end

  def publisher_id
    params.require(:publisher_id)
  end
end
```

## `resource_for` Options

| Option | Type | Description |
|---|---|---|
| `only` | Symbol / Array | List of actions to generate |
| `except` | Symbol / Array | List of actions to skip |
| `decorator` | Class / Boolean | Decorator class or flag to enable/disable decoration |
| `before_save` | Symbol / Proc | Method or proc called before `create` or `update` saves |
| `after_save` | Symbol / Proc | Method or proc called after `create` or `update` saves |
| `build_with` | Symbol / Proc | Method or block used to build the resource on `create` |
| `update_with` | Symbol / Proc | Method or block used to update the resource on `update` |
| `paginated` | Boolean | Enable pagination on the `index` action |
| `per_page` | Integer | Number of items per page when pagination is active (default: 20) |
| `id_key` | Symbol | Parameter key used to look up a single resource (default: `:id`) |
| `param_key` | Symbol | Parameter key used to find the model |

### Callbacks: `before_save` and `after_save`

```ruby
class PokemonsController < ApplicationController
  include Azeroth::Resourceable

  resource_for :pokemon,
               only: %i[create update],
               before_save: :set_favorite

  private

  def set_favorite
    pokemon.favorite = true
  end
end
```

### Pagination

```ruby
class DocumentsController < ApplicationController
  include Azeroth::Resourceable

  resource_for :document, only: :index, paginated: true, per_page: 10
end
```

A paginated `index` request returns the items for the requested page and sets the following response headers:

| Header | Description |
|---|---|
| `pages` | Total number of pages |
| `per_page` | Number of items per page |
| `page` | Current page number |

```bash
GET /documents.json        # page 1 – first 10 documents
GET /documents.json?page=2 # page 2 – next 10 documents
```

## JSON Serialization with `Azeroth::Decorator`

Decorators control which attributes are included in JSON responses.

### Defining a Decorator

Create a decorator class that inherits from `Azeroth::Decorator` and call `expose` for each attribute to include:

```ruby
# app/decorators/pokemon/decorator.rb
class Pokemon::Decorator < Azeroth::Decorator
  expose :name
  expose :previous_form_name, as: :evolution_of, if: :evolution?

  def evolution?
    previous_form
  end

  def previous_form_name
    previous_form.name
  end
end
```

### `expose` Options

| Option | Type | Description |
|---|---|---|
| `as` | Symbol | Custom JSON key for the attribute |
| `if` | Symbol / Proc | Method or block; attribute is only included when it returns truthy |
| `decorator` | Class / Boolean | Nested decorator class or flag to enable/disable decoration |
| `reader` | Boolean | Whether to create a reader method for the attribute |
| `override` | Boolean | Whether to override an existing method with the same name |

### Decorator Inheritance

Extend decorators by subclassing them:

```ruby
# app/decorators/pokemon/favorite_decorator.rb
class Pokemon::FavoriteDecorator < Pokemon::Decorator
  expose :nickname
end
```

### Using a Custom Decorator in a Controller

Pass the decorator class to `resource_for`:

```ruby
class PokemonsController < ApplicationController
  include Azeroth::Resourceable

  resource_for :pokemon, decorator: Pokemon::FavoriteDecorator
end
```

## `model_for`

`model_for` adds singular and plural resource accessor methods to a controller (e.g., `document` and `documents`) **without** generating any HTTP route actions. This is useful when a controller needs to access a resource as context (for example a parent record) but should not expose CRUD endpoints for it.

### Options

| Option | Type | Description |
|---|---|---|
| `id_key` | Symbol | Parameter key used to find the record (default: `:id`) |
| `param_key` | Symbol | Parameter key used to find the model |

### Example

```ruby
class PostsController < ApplicationController
  include Azeroth::Resourceable

  # Generates full CRUD endpoints for Post,
  # scoped to the author resolved by model_for below.
  resource_for :post

  # Only adds `author` and `authors` helper methods —
  # no HTTP actions are created for Author.
  model_for :author, id_key: :author_id

  private

  def posts
    author.posts
  end
end
```

In this example:
- `GET /authors/:author_id/posts.json` returns all posts belonging to the author.
- `author` is resolved automatically via `Author.find(params[:author_id])`.
- No `/authors` CRUD endpoints are generated.

## Best Practices

- **Use `only:` / `except:`** to expose only the actions your controller actually needs.
- **Override collection methods** (e.g., `def games`) to scope resources to a parent instead of returning the full table.
- **Use decorators** to keep serialization logic out of controllers and models.
- **Use `before_save` / `after_save`** callbacks for business logic that must run around persistence, rather than overriding generated action methods.
- **Prefer `resource_for`** over hand-written CRUD actions for standard resources to ensure consistent behavior across your application.

## Testing Controllers That Use Azeroth

Use standard Rails request specs or controller specs with RSpec. Since Azeroth generates conventional Rails actions, they can be exercised like any other controller action:

```ruby
RSpec.describe PokemonsController, type: :request do
  let(:master) { create(:pokemon_master) }

  describe 'POST /pokemons' do
    it 'creates a pokemon' do
      post "/pokemon_masters/#{master.id}/pokemons.json",
           params: { pokemon: { name: 'Bulbasaur' } }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body['name']).to eq('Bulbasaur')
    end
  end

  describe 'GET /pokemons' do
    it 'returns all pokemons' do
      get "/pokemon_masters/#{master.id}/pokemons.json"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to be_an(Array)
    end
  end
end
```

## Further Reading

- [Azeroth on RubyGems](https://rubygems.org/gems/azeroth)
- [YARD Documentation](https://www.rubydoc.info/gems/azeroth)
- [GitHub Repository](https://github.com/darthjee/azeroth)
