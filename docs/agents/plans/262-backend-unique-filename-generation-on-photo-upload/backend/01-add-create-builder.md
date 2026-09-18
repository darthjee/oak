# Add Oak::Photo::CreateBuilder

Add a new builder that generates a unique, sanitized `file_name` when a
photo is created, following the `Sinclair::Model` builder convention
already used for single-builder entities like `Oak::Category::CreateBuilder`
(`source/app/builders/oak/category/create_builder.rb`) — no separate
`BaseBuilder` needed here since, unlike `Oak::Item`, photos don't have an
`UpdateBuilder` to share attributes with.

The builder takes a `scope` (an `ActiveRecord::Relation` on `Oak::Photo`,
e.g. `item.photos`) and the client-supplied `file_name`, and builds an
unsaved `Oak::Photo` with:

- `file_name` replaced by a sanitized stem + `-` + `SecureRandom.uuid` +
  the original extension, e.g. `arcanum.png` → `arcanum-<uuid>.png`. Use
  `SecureRandom.uuid`, not `rand`/`hex` — matches majora's
  `PhotoPathBuilder`/UUIDv4 approach exactly (see the issue's Solution
  section).
- Sanitization of the stem only (not the extension): replace any character
  outside `[a-zA-Z0-9_-]` with `_`, and fall back to a fixed placeholder
  (e.g. `"photo"`) if the sanitized stem ends up empty (e.g. the original
  filename was only symbols, or had no stem at all). Do **not** re-validate
  the extension against an allow-list — the Tent proxy already does that at
  Submit time (see the issue's Solution section), so backend Init doesn't
  need to duplicate it.
- `ready: false` (same default the controller sets today).

## Files to Change

- `source/app/builders/oak/photo/create_builder.rb` (new) — the builder
  itself:

  ```ruby
  # frozen_string_literal: true

  module Oak
    class Photo
      class CreateBuilder < Sinclair::Model
        initialize_with({
                          scope: nil,
                          file_name: nil
                        }, **{})

        def self.build(**params)
          new(**params).build
        end

        def build
          scope.build(photo_params)
        end

        private

        def scope
          @scope ||= Oak::Photo.all
        end

        def photo_params
          {
            file_name: unique_file_name,
            ready: false
          }
        end

        def unique_file_name
          "#{sanitized_stem}-#{SecureRandom.uuid}#{extension}"
        end

        def sanitized_stem
          stem = File.basename(file_name.to_s, extension).gsub(/[^a-zA-Z0-9_-]/, '_')
          stem.presence || 'photo'
        end

        def extension
          File.extname(file_name.to_s)
        end
      end
    end
  end
  ```

  (Adjust naming/structure to match reviewer feedback and existing
  conventions in `source/app/builders/oak/` — the above is a concrete
  starting point, not a literal requirement.)
