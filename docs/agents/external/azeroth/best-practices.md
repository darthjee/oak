[← Back to guide index](../azeroth-usage.md)

# Best Practices

- **Use `only:` / `except:`** to expose only the actions your controller actually needs.
- **Override collection methods** (e.g., `def games`) to scope resources to a parent instead of returning the full table.
- **Use decorators** to keep serialization logic out of controllers and models.
- **Use `before_save` / `after_save`** callbacks for business logic that must run around persistence, rather than overriding generated action methods.
- **Prefer `resource_for`** over hand-written CRUD actions for standard resources to ensure consistent behavior across your application.
