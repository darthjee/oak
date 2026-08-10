# Execution Model (summary)

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

[Back to hub](../jace-usage.md)
