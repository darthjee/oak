[← Back to guide index](../azeroth-usage.md)

# `model_for`

`model_for` adds singular and plural resource accessor methods to a controller (e.g., `document` and `documents`) **without** generating any HTTP route actions. This is useful when a controller needs to access a resource as context (for example a parent record) but should not expose CRUD endpoints for it.

## Options

| Option | Type | Description |
|---|---|---|
| `id_key` | Symbol | Model attribute the record is looked up by (default: `:id`) |
| `param_key` | Symbol | Request parameter key read to get the lookup value (default: `:id`) |

## Example

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
