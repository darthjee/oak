# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Item::ShowDecorator do
  subject(:decorator) { described_class.new(item.tap(&:validate)) }

  let(:item) { build(:oak_item, name:, category:, kind:, photos:) }
  let(:name) { 'Sample Item' }
  let(:category) { build(:oak_category) }
  let(:kind) { build(:oak_kind) }
  let(:photos) { build_list(:oak_photo, 2) }

  let(:decorated_category) { Oak::Category::Decorator.new(category) }
  let(:decorated_kind) { Oak::Kind::Decorator.new(kind) }
  let(:decorated_photos) { Oak::Photo::Decorator.new(photos) }

  let(:category_json) { decorated_category.as_json }
  let(:kind_json) { decorated_kind.as_json }
  let(:photos_json) { decorated_photos.as_json }

  describe '#as_json' do
    let(:expected) do
      {
        id: item.id,
        name:,
        category: category_json,
        kind: kind_json,
        photos: photos_json
      }.stringify_keys
    end

    context 'when the item has all attributes' do
      it 'includes the id, name, category, kind, and photos' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when the item has no photos' do
      let(:photos) { [] }
      let(:photos_json) { [] }
      let(:expected) do
        {
          id: item.id,
          name:,
          category: category_json,
          kind: kind_json,
          photos: []
        }.stringify_keys
      end

      it 'includes the id, name, category, kind, and an empty photos array' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when the item is invalid' do
      let(:name) { '' }
      let(:errors) { { name: ["can't be blank"] } }
      let(:expected) do
        {
          id: item.id,
          name:,
          category: category_json,
          kind: kind_json,
          photos: photos_json,
          errors:
        }.deep_stringify_keys
      end

      it 'includes the id, name, category, kind, photos, and errors' do
        item.validate # Trigger validations
        expect(decorator.as_json).to eq(expected)
      end
    end
  end
end
