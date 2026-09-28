# Remove migration endpoints and helpers

Delete the prepare/confirm endpoints and the classes that only they use.

## Files to Change
- `source/app/controllers/user/photos/migrations_controller.rb` — delete.
- `source/app/decorators/oak/photo/migration_decorator.rb` — delete.
- `source/app/models/oak/photo/migration_claimer.rb` — delete.
- `source/config/routes.rb` — remove `post 'photos/migration/prepare'` and `patch 'photos/migration'` from the `namespace :user` block.
- `source/.rubocop.yml` — remove the `config/routes.rb` `Metrics/BlockLength` exclusion if rubocop passes without it.
- `source/spec/controllers/user/photos/migrations_controller_spec.rb` — delete.
- `source/spec/models/oak/photo/migration_claimer_spec.rb` — delete.
- `source/spec/routing/user_photos_migration_routing_spec.rb` — delete.
