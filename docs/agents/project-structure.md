# Project Structure

Is organized in a way that reflects the Rails conventions while also accommodating the SPA architecture and containerization setup.

## Main Directories

- `source/` - Rails application source code
  - `app/controllers/` - Rails controllers
  - `app/models/` - ActiveRecord models
  - `app/builders/` - Classes for building complex objects
  - `app/decorators/` - Decorators for presentation logic
  - `app/views/` - ERB templates and partials
  - `app/assets/` - Assets (CSS, JavaScript, images)
  - `spec/` - RSpec tests
- `docker-compose.yml` - Container orchestration
- `dockerfiles/` - Docker image definitions (one subdirectory per image)

## Containerization

- Use `docker-compose` to start the environment
- Persistent volumes for MySQL in `docker_volumes/mysql_data/`
- Development public files in `dev_public_files/`
- Production public files in `prod_public_files/`
