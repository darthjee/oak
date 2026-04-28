# Development Principles

In order to achieve maintainability and readability, we follow these principles:

## Language Standard

- **English only**: All code, PR titles/descriptions, documentation, commit messages, and code comments must be written in English.

## Code and Best Practices

- **Sandi Metz principles**: We follow Sandi Metz rules for object-oriented design
  - Classes with max 100 lines
  - Methods with max 5 lines
  - Pass max 4 parameters
  - Controllers instantiate only one object
- **Understandable code**: Priority for clarity and maintainability over "clever code"
- **RuboCop**: Mandatory linter for style consistency
- **Tests**: Robust test coverage is fundamental

## When Suggesting Code

1. Keep methods small and focused (max 5 lines when possible)
2. Extract complex logic to service classes or builders
3. Use decorators for presentation logic
4. Suggest tests along with implementations
5. Follow RuboCop conventions
6. Prefer readability over premature optimization
