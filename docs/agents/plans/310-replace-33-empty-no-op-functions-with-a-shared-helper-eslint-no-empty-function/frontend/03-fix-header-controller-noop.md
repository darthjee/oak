# Fix production no-op in HeaderController

`HeaderController.js`'s `#checkLogin` method intentionally swallows a
rejected promise with `.catch(() => {})`. Since production code must not
import from `frontend/spec/support/`, define a small locally-named no-op
(e.g. a private method like `#ignore()` or a local named function) in this
file and use it in place of the inline empty arrow function, so the intent
(deliberately ignoring the error) is explicit and ESLint no longer flags an
anonymous empty function body.

## Files to Change

- `frontend/assets/js/components/elements/controllers/HeaderController.js` — replace the inline `.catch(() => {})` at `#checkLogin` with a call to a new locally-named no-op.
