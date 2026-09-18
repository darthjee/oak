# Wire the builder into Items::PhotosController

Replace the controller's current inline `build_photo` (which trusts the
client's `file_name` verbatim: `photos.build(photo_params.merge(ready:
false))`) with a call into the new `Oak::Photo::CreateBuilder`, following
the exact same wiring convention `ItemsController#build_item` already uses
for `Oak::Item::CreateBuilder` (`source/app/controllers/items_controller.rb:51`).

## Files to Change

- `source/app/controllers/items/photos_controller.rb`:
  - `build_photo` becomes:
    ```ruby
    def build_photo
      Oak::Photo::CreateBuilder.build(**create_params)
    end

    def create_params
      photo_params.to_h.symbolize_keys.merge(scope: photos)
    end
    ```
  - `photo_params` (`params.require(:photo).permit(:file_name)`) is
    unchanged — the raw client filename is still read here, just no longer
    used verbatim; sanitization/uniqueness now happens inside the builder.
  - No other action in this controller changes — `gate_uploading`,
    `finalize`, and `file_path` are unaffected by this issue.
