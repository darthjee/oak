# Issue: Add Inline Documentation for Frontend

## Description

The new frontend scripts (React + Vite) need inline documentation covering all public classes and methods.

## Problem

- Frontend scripts currently lack inline documentation
- No standardized way to describe method parameters and return values
- No lint rule enforcing documentation presence, allowing it to degrade over time

## Expected Behavior

- All classes and methods have inline doc comments
- Method parameters are documented with their types and descriptions
- Return values are documented
- A linter (e.g., ESLint with a JSDoc/TSDoc plugin) enforces documentation so it is always present

## Solution

- Add JSDoc (or TSDoc if TypeScript is used) comments to all frontend classes and methods
- Configure ESLint with `eslint-plugin-jsdoc` (or equivalent) to enforce documentation rules
- Integrate the lint check into the CI pipeline so documentation gaps are caught automatically

## Benefits

- Improves maintainability and onboarding for new contributors
- Self-documenting code reduces the need for external references
- Lint enforcement prevents documentation from becoming stale or incomplete

---
See issue for details: https://github.com/darthjee/oak/issues/115
