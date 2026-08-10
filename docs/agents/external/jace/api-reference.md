# API Reference

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

---

[Back to hub](../jace-usage.md)
