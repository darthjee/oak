# Frontend Plan: Replace 33 empty no-op functions with a shared helper (ESLint no-empty-function)

Main plan: [plan.md](plan.md)

## Steps

- [01 — Add shared noop test helper](frontend/01-add-noop-helper.md)
- [02 — Replace inline no-ops in spec files](frontend/02-replace-spec-noops.md)
- [03 — Fix production no-op in HeaderController](frontend/03-fix-header-controller-noop.md)

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes

- Pure refactor — no behavior change expected; existing spec assertions
  should pass unchanged once `() => {}` mocks are replaced with `noop`.
- Line numbers in the issue may have drifted slightly since it was filed;
  match by the `() => {}` pattern within each listed file rather than by
  exact line number alone.
