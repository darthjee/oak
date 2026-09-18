# Update specs

Add a spec for the new builder and update the existing controller spec,
which currently hardcodes the pre-fix raw-filename behavior.

## Files to Change

- `source/spec/builders/oak/photo/create_builder_spec.rb` (new) — mirror
  the shape of `source/spec/builders/oak/category/create_builder_spec.rb`.
  Cover:
  - Returns an unsaved `Oak::Photo` built on the given `scope`.
  - The built photo's `file_name` keeps the original extension and a
    sanitized version of the original stem, plus a UUID suffix (e.g.
    assert against a regex like `/\Acat-[0-9a-f-]{36}\.jpg\z/` for input
    `cat.jpg`).
  - Two builds with the same input `file_name` (same scope) produce
    different `file_name` values and both save successfully — the actual
    regression this issue fixes.
  - A `file_name` containing characters outside `[a-zA-Z0-9_-]` in the stem
    (e.g. spaces, `..`, unicode) gets those characters sanitized, not
    passed through raw.
  - `ready` defaults to `false`.

- `source/spec/controllers/items/photos_controller_spec.rb`:
  - `POST #create`'s `expected_response` currently asserts
    `'file_name' => 'cat.jpg'` verbatim (line ~23) — this is exactly the
    pre-fix behavior. Update it to assert the new pattern instead, e.g.:
    ```ruby
    it 'returns the photo without url fields' do
      post :create, params: parameters

      expect(response_json).to include(
        'id' => Oak::Photo.last.id,
        'ready' => false
      )
      expect(response_json['file_name']).to match(/\Acat-[0-9a-f-]{36}\.jpg\z/)
    end
    ```
  - Add a new context covering the actual bug: creating two photos with
    the same `file_name` param on the same item both succeed (no
    `"has already been taken"` error), e.g.:
    ```ruby
    context 'when a photo with the same original file_name already exists on the item' do
      before { create(:oak_photo, item:, file_name: 'cat-existing-uuid.jpg') }

      it 'still creates a new Oak::Photo' do
        expect { post :create, params: parameters }.to change(Oak::Photo, :count).by(1)
      end

      it 'returns a successful response' do
        post :create, params: parameters

        expect(response).to have_http_status(:created)
      end
    end
    ```
    (Adjust factory/setup details as needed to fit the existing `let`s in
    this spec file.)

No model spec changes expected — `Oak::Photo`'s `uniqueness: { scope:
:item_id }` validation on `file_name` is unchanged; the builder just makes
collisions with it effectively impossible in practice.
