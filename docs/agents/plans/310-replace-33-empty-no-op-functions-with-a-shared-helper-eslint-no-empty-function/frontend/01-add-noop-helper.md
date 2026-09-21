# Add shared noop test helper

Create a new test-support module exporting a single named no-op function,
alongside the existing `frontend/spec/support/factories.js` and other
support modules. This is the helper Step 02 imports everywhere a spec
currently uses an inline `() => {}` mock.

```js
export const noop = () => {};
```

## Files to Change

- `frontend/spec/support/noop.js` — new file, exports `noop`.
