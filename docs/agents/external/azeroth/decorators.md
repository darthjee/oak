[← Back to guide index](../azeroth-usage.md)

# JSON Serialization with `Azeroth::Decorator`

Decorators control which attributes are included in JSON responses.

## Defining a Decorator

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

## `expose` Options

| Option | Type | Description |
|---|---|---|
| `as` | Symbol | Custom JSON key for the attribute |
| `if` | Symbol / Proc | Method or block; attribute is only included when it returns truthy |
| `decorator` | Class / Boolean | Nested decorator class or flag to enable/disable decoration |
| `reader` | Boolean | Whether to create a reader method for the attribute |
| `override` | Boolean | Whether to override an existing method with the same name |

## Decorator Inheritance

Extend decorators by subclassing them:

```ruby
# app/decorators/pokemon/favorite_decorator.rb
class Pokemon::FavoriteDecorator < Pokemon::Decorator
  expose :nickname
end
```

## Using a Custom Decorator in a Controller

Pass the decorator class to `resource_for`:

```ruby
class PokemonsController < ApplicationController
  include Azeroth::Resourceable

  resource_for :pokemon, decorator: Pokemon::FavoriteDecorator
end
```
