# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Item::ShowDecorator do
  subject(:decorator) { described_class.new(item.tap(&:validate)) }

  let(:item) { build(:oak_item, name:, category:, kind:, photos:, links:, description:) }
  let(:name) { 'Sample Item' }
  let(:description) { 'Sample Description' }
  let(:category) { build(:oak_category) }
  let(:kind) { build(:oak_kind) }
  let(:photos) { build_list(:oak_photo, 2) }
  let(:links) { build_list(:oak_link, 2) }

  let(:decorated_category) { Oak::Category::Decorator.new(category) }
  let(:decorated_kind) { Oak::Kind::Decorator.new(kind) }
  let(:decorated_photos) { Oak::Photo::Decorator.new(photos) }
  let(:decorated_links) { Oak::Link::Decorator.new(links) }

  let(:category_json) { decorated_category.as_json }
  let(:kind_json) { decorated_kind.as_json }
  let(:photos_json) { decorated_photos.as_json }
  let(:links_json) { decorated_links.as_json }

  describe '#as_json' do
    let(:expected) do
      {
        id: item.id,
        name:,
        description:,
        category: category_json,
        kind: kind_json,
        photos: photos_json,
        links: links_json
      }.stringify_keys
    end

    context 'when the item has all attributes' do
      it 'includes the id, name, category, kind, photos, and links' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when the item has no photos or links' do
      let(:photos) { [] }
      let(:links) { [] }
      let(:photos_json) { [] }
      let(:links_json) { [] }
      let(:expected) do
        {
          id: item.id,
          name:,
          description:,
          category: category_json,
          kind: kind_json,
          photos: [],
          links: []
        }.stringify_keys
      end

      it 'includes the id, name, category, kind, and empty arrays for photos and links' do
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
          description:,
          category: category_json,
          kind: kind_json,
          photos: photos_json,
          links: links_json,
          errors:
        }.deep_stringify_keys
      end

      it 'includes the id, name, category, kind, photos, links, and errors' do
        item.validate # Trigger validations
        expect(decorator.as_json).to eq(expected)
      end
    end
  end
end
