# Handlers

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

[Back to hub](../jace-usage.md)
