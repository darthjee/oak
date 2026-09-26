# Prepare endpoint

Add routes inside `namespace :user`:

```ruby
namespace :user do
  resources :categories, only: :index
  post 'photos/migration/prepare' => 'photos/migrations#prepare'
  patch 'photos/migration' => 'photos/migrations#update'
end
```

(Any equivalent routing that yields `POST /user/photos/migration/prepare` and `PATCH /user/photos/migration` is fine.)

Create `User::Photos::MigrationsController < ApplicationController`:

- `include LoggedUser`, `protect_from_forgery except: %i[prepare update]`;
- `before_action` that runs `head :unauthorized` unless `logged_user`. Do not rely on `check_logged!`, which maps to 404.

`prepare`:

1. `limit`: `Integer(params[:limit], exception: false)`, default 10 when nil or invalid, clamped to `1..50`.
2. Base scope: `Oak::Photo.unscope(:order).joins(:item).where(items: { user_id: logged_user.id }, ready: true)`.
3. `remaining`: base scope `.where(migration_status: %w[pending migrating]).count`, computed before claiming.
4. Candidates: base scope where `pending`, OR `migrating` with `migration_claimed_at < now - Oak::Photo::MIGRATION_CLAIM_TIMEOUT`, ordered by id, `limit`.
5. For each candidate, claim atomically: `Oak::Photo.unscoped.where(id:).where(<same claimable condition>).update_all(['migration_status = ?, migration_file_name = COALESCE(migration_file_name, ?), migration_claimed_at = ?', 'migrating', UniqueFileName.build(photo.file_name), now])`. Keep only candidates where the affected count is 1, then reload them to read the persisted `migration_file_name`.
6. Render `{ photos: [{ id, legacy_path: "users/<uid>/items/<item_id>/<file_name>", file_path: "users/<uid>/items/<item_id>/<migration_file_name>" }], remaining }`. Put the claim loop in a small service object (e.g. `Oak::Photo::MigrationClaimer`) and the JSON shape in a decorator (e.g. `Oak::Photo::MigrationDecorator`), following the repo's decorator pattern.

Specs (controller spec and service spec):

- `401` when not logged;
- only the caller's `ready: true` photos are returned;
- `pending` rows are claimed and become `migrating` with a name and a timestamp;
- a second call does not return already-claimed rows;
- a stale `migrating` row is re-claimed and keeps its `migration_file_name`;
- non-stale `migrating`, `migrated` and `missing` rows are skipped;
- `limit` default and clamping;
- `remaining` counts only ready `pending` + `migrating` rows, before the batch.

Add a routing spec for both routes.

## Files to Change

- `source/config/routes.rb`: two routes under `namespace :user`.
- `source/app/controllers/user/photos/migrations_controller.rb`: new controller (`prepare`, auth).
- `source/app/models/oak/photo/migration_claimer.rb`: claim service (or another name that fits the repo).
- `source/app/decorators/oak/photo/migration_decorator.rb`: JSON shape.
- `source/spec/controllers/user/photos/migrations_controller_spec.rb`: new.
- `source/spec/models/oak/photo/migration_claimer_spec.rb`: new.
- `source/spec/routing/user_photos_migration_routing_spec.rb`: new.
