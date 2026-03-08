# Behaviors

This document describes application behaviors and conventions that should be preserved during future development.

## Not Found handling

- When a record/resource is not found, Oak should respond with HTTP 404 (Not Found) instead of raising `ActiveRecord::RecordNotFound`.
- Prefer controller/service patterns that convert missing resources into a 404 response for both HTML and JSON requests.
