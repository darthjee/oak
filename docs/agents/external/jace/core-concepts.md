# Core Concepts

### `Jace::Registry`

The central object. It stores event-to-handler mappings and exposes two public
methods: `register` and `trigger`.

```ruby
registry = Jace::Registry.new
```

### `register(event, instant = :after, &block)`

Adds a handler block for a named event. The `instant` parameter controls whether
the block runs before or after the main event block.

| `instant` | When the handler runs |
|-----------|----------------------|
| `:after` (default) | After the main block |
| `:before` | Before the main block |

```ruby
registry.register(:payment_processed)          { send_receipt }
registry.register(:payment_processed, :before) { validate_payment }
```

### `trigger(event, context, &block)`

Fires the named event. Jace runs the `before` handlers, then the given block,
then the `after` handlers. The `before` and `after` handlers are `instance_eval`'d
inside `context`, so bare method calls in handlers resolve against the context.
The main block is called normally (not `instance_eval`'d), so it uses the
surrounding scope's receiver.

```ruby
registry.trigger(:payment_processed, payment_object) do
  charge_credit_card
end
```

---

[Back to hub](../jace-usage.md)
