# Backend Plan: Kinds: add "New kind" entry point and category selection on the kind form

Main plan: [plan.md](plan.md)

## Shared contracts

- Produce the kind form JSON: `{ name, slug, snap_url, categories: [{ name, slug }] }` from `GET /kinds/new.json`, `GET /kinds/:slug.json`, and the create/update responses.
- Accept `{ kind: { name, categories: [{ slug }] } }` on `POST /kinds.json` / `PATCH /kinds/:slug.json`, doing a full sync of category links:
  - `categories: []` unlinks every category;
  - no `categories` key (update) leaves links untouched;
  - unknown slugs are ignored.
- `GET /categories.json?filters[include_empty]=true` is consumed as-is by the frontend; no change needed.

## Steps

- [01 — Kind/category association and form decorator](backend/01-association-and-form-decorator.md)
- [02 — Kind create/update builders](backend/02-kind-builders.md)
- [03 — Wire builders and params into KindsController](backend/03-kinds-controller.md)

## CI Checks

- `source`: `cd source && bundle exec rspec` (CI job: `test`)
- `source`: `rubocop` (CI job: `checks`)

## Notes

- Strong params may drop an explicit empty array: `params.require(:kind).permit(:name, categories: [:slug])` can turn `categories: []` into a missing key. If it does, detect presence with `params[:kind].key?(:categories)` and pass `categories: []` explicitly to the builder. A controller spec must prove `categories: []` unlinks everything while a missing key does not.
- Unlinking a category whose items still use the kind is allowed; do **not** add item validation.
