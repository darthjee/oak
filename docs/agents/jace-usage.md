# Using the Jace Gem

## What is Jace?

**Jace** is a Ruby gem for event-driven development **within a single application**.
It is not about distributed architecture or message queues — it is about building
internal event-oriented logic inside a Ruby gem or application.

With Jace, you register handlers for named events and trigger those events from
anywhere in your codebase. When an event is triggered, Jace executes the registered
`before` handlers (inside the context via `instance_eval`), then the main block,
then the `after` handlers (also inside the context via `instance_eval`).

---

## Installation

Add `jace` to your `Gemfile`:

```ruby
gem 'jace'
```

Then run:

```bash
bundle install
```

Or install it directly:

```bash
gem install jace
```

---

## Core Concepts

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

## Basic Usage

```ruby
class Order
  attr_reader :log

  def initialize
    @log = []
  end

  def validate
    log << 'validated'
  end

  def persist
    log << 'persisted'
  end

  def notify
    log << 'notified'
  end
end

registry = Jace::Registry.new
order    = Order.new

registry.register(:save, :before) { validate }
registry.register(:save)          { notify }

registry.trigger(:save, order) do
  order.persist   # main block uses the surrounding scope, so explicit receiver is needed
end

order.log
# => ['validated', 'persisted', 'notified']
```

---

## Handler Types

Handlers are registered as **blocks** (procs) and are `instance_eval`'d inside
the context object when the event fires, so bare method calls resolve against
the context.

```ruby
registry.register(:shipment_sent)          { send_confirmation_email }
registry.register(:shipment_sent, :before) { freeze_order }
```

---

## Multiple Handlers per Event

You can register as many `before` and `after` handlers as you like for the same
event. They execute in registration order.

```ruby
registry.register(:user_created, :before) { sanitize_input }
registry.register(:user_created, :before) { check_duplicates }
registry.register(:user_created)          { send_welcome_email }
registry.register(:user_created)          { notify_admin }

registry.trigger(:user_created, user_context) do
  persist_user
end
# Order: sanitize_input → check_duplicates → persist_user
#        → send_welcome_email → notify_admin
```

---

## Triggering Events Without a Main Block

The main block is optional. If omitted, only the registered handlers run:

```ruby
registry.trigger(:cache_invalidated, cache_context)
# Runs all :before handlers, then all :after handlers; no main block
```

---

## Triggering an Unregistered Event

Triggering an event that has no registered handlers is safe. The main block is
still executed, and no error is raised:

```ruby
registry.trigger(:unknown_event, some_context) do
  do_work
end
# do_work runs normally; no handlers fire
```

---

## Typical Integration Pattern

The most common pattern is to hold a `Jace::Registry` instance inside a service
or module and expose `register` to callers so they can hook into lifecycle events:

```ruby
module PaymentService
  REGISTRY = Jace::Registry.new

  def self.on(event, instant = :after, &block)
    REGISTRY.register(event, instant, &block)
  end

  def self.process(payment)
    REGISTRY.trigger(:payment_processed, payment) do
      payment.charge!
    end
  end
end

# In an initializer or plugin:
PaymentService.on(:payment_processed)          { send_receipt }
PaymentService.on(:payment_processed, :before) { log_attempt }

# Elsewhere in the application:
PaymentService.process(payment)
# Runs: log_attempt → payment.charge! → send_receipt
```

---

## Execution Model (summary)

```
registry.trigger(:event, context) { main_block }

Execution order:
  1. All :before handlers  (in registration order, instance_eval'd in context)
  2. main_block            (called as-is, context is NOT the receiver)
  3. All :after  handlers  (in registration order, instance_eval'd in context)
```

> **Note:** The `before` and `after` handlers are `instance_eval`'d inside the
> context object, so bare method calls inside them (`send_receipt`, `validate`,
> etc.) resolve against the context. The main block, however, is a regular
> `call` (not `instance_eval`), so its receiver is the surrounding scope.

---

## API Reference

| Method | Signature | Description |
|--------|-----------|-------------|
| `Registry#register` | `(event, instant = :after, &block)` | Adds a handler to the named event |
| `Registry#trigger` | `(event, context, &block)` | Fires the event, running handlers around the block |
| `Registry#events` | `()` | Returns all registered event names as `Array<Symbol>` |
| `Registry#registry` | `()` | Returns the raw `Hash` of event → `Dispatcher` mappings |

---

## YARD Documentation

Full API docs: [https://www.rubydoc.info/gems/jace](https://www.rubydoc.info/gems/jace)

Source: [https://github.com/darthjee/jace](https://github.com/darthjee/jace)
