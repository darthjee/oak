[← Back to guide index](../azeroth-usage.md)

# Basic Usage

## Setting Up `resource_for`

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

## Available Actions

By default, `resource_for` builds all seven standard actions: `create`, `show`,
`index`, `update`, `destroy`, `edit`, and `new`. Use `only:` or `except:` to
restrict which actions are generated:

```ruby
# Only generate index and show
resource_for :article, only: %i[index show]

# Generate everything except destroy
resource_for :article, except: :destroy
```

> Note: the action generated for deleting a resource is named `destroy`
> (matching Rails' own controller action naming), not `delete`. Pass
> `except: :destroy` — not `except: :delete` — to skip it.

## Nested Resources

Override the collection method to scope resources to a parent:

```ruby
class GamesController < ApplicationController
  include Azeroth::Resourceable
  skip_before_action :verify_authenticity_token

  resource_for :game, except: :destroy

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
