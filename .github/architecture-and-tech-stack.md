# Architecture and Tech Stack

## Backend

- **Ruby on Rails** - Main application server
- **Docker + Docker Compose** - Containerization and orchestration
- Backend and frontend are served by the same Rails application (monolithic architecture, no separation yet)

## Frontend

- **AngularJS** - JavaScript framework for Single Page Application
- **Cyberhawk** (<https://github.com/darthjee/cyberhawk>) - Route and request management

## Main Libraries and Gems

- **Tarquinn** (<https://github.com/darthjee/tarquinn>) - Route management and redirection. See [tarquinn-usage.md](tarquinn-usage.md) for detailed usage patterns.
- **OnePageApplication concern** (<https://github.com/darthjee/oak/blob/main/source/app/controllers/concerns/one_page_application.rb>) - Ensures navigation via anchor
- **Sinclair** (<https://github.com/darthjee/sinclair>) - Dynamic method builder, configuration, options, and model helpers. See [sinclair-usage.md](sinclair-usage.md) for detailed usage patterns.
- **Azeroth** (<https://github.com/darthjee/azeroth>) - Simplifies Rails controller endpoints with `resource_for`. See [azeroth-usage.md](azeroth-usage.md) for detailed usage patterns.
- **Magicka** (<https://github.com/darthjee/magicka>) - Renders AngularJS-compatible form and display elements in ERB templates. See [magicka-usage.md](magicka-usage.md) for detailed usage patterns.
