# Confirm endpoint

Add `update` to `User::Photos::MigrationsController` (same 401 guard):

- Read `params[:migrated]` and `params[:missing]` as arrays of ids (default `[]`, cast to integers, ignore junk).
- `missing_ids = missing - migrated` (`migrated` wins when an id is in both lists).
- Scope: the caller's photos (`joins(:item).where(items: { user_id: logged_user.id })`) with `migration_status: 'migrating'`, unscoped order.
- Migrated: `scope.where(id: migrated).update_all('file_name = migration_file_name, migration_status = \'migrated\'')`. Use SQL so the swap is atomic and needs no per-row load. Guard with `where.not(migration_file_name: nil)`.
- Missing: `scope.where(id: missing_ids).update_all(migration_status: 'missing')`.
- Respond `head :ok` (or `200` with an empty JSON body, whichever the proxy handles more easily; the contract only needs `200`).

Specs:

- `401` when not logged;
- migrated ids swap `file_name` and become `migrated`;
- missing ids become `missing` and keep `file_name`;
- foreign users' ids, unknown ids and non-`migrating` rows are left untouched;
- an id in both lists ends up `migrated`.

## Files to Change

- `source/app/controllers/user/photos/migrations_controller.rb`: `update` action.
- `source/spec/controllers/user/photos/migrations_controller_spec.rb`: PATCH coverage.
