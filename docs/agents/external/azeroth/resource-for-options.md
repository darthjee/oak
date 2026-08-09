[← Back to guide index](../azeroth-usage.md)

# `resource_for` Options

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
| `id_key` | Symbol | Model attribute the record is looked up by (default: `:id`) |
| `param_key` | Symbol | Request parameter key read to get the lookup value (default: `:id`) |

`id_key` and `param_key` work together: the resource is fetched with
`collection.find_by!(id_key => params[param_key])`. Change `id_key` to look
records up by a different column (e.g. `:slug`); change `param_key` when the
identifier arrives under a different param name (e.g. a nested route param
like `:document_id`).

## Callbacks: `before_save` and `after_save`

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

## Pagination

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
