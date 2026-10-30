# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Kind::FormDecorator do
  subject(:decorator) { described_class.new(kind.tap(&:validate)) }

  let(:kind) { build(:oak_kind, name:) }
  let(:slug) { kind.slug }
  let(:name) { 'Sample Kind' }
  let(:snap_url) { '/assets/images/kind.png' }
  let(:categories) { [] }

  describe '#as_json' do
    let(:expected) do
      {
        name:,
        slug:,
        snap_url:,
        categories:
      }.stringify_keys
    end

    context 'when there is no linked category' do
      it 'includes empty categories' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when there are categories associated' do
      let(:kind) { create(:oak_kind, name:) }
      let!(:first_category) { create(:oak_category, name: 'category-1') }
      let!(:second_category) { create(:oak_category, name: 'category-2') }
      let(:categories) do
        [
          { name: 'category-1', slug: first_category.slug },
          { name: 'category-2', slug: second_category.slug }
        ].map(&:stringify_keys)
      end

      before do
        create(:oak_category_kind, category: first_category, kind:)
        create(:oak_category_kind, category: second_category, kind:)
      end

      it 'includes the categories with name and slug only' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when there are items with photo' do
      let!(:item) { create(:oak_item, kind:) }
      let!(:photo) { create(:oak_photo, item:) }
      let(:user) { item.user }

      let(:snap_url) do
        [
          Settings.photos_server_url,
          :snaps,
          :users,
          user.id,
          :items,
          item.id,
          photo.file_name
        ].join('/')
      end

      it 'includes the snap url' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when kind is invalid' do
      let(:name) { nil }
      let(:errors) { { name: ["can't be blank"], slug: ["can't be blank"] } }
      let(:expected) do
        {
          name:,
          slug:,
          snap_url:,
          categories:,
          errors:
        }.deep_stringify_keys
      end

      it 'includes the errors' do
        expect(decorator.as_json).to eq(expected)
      end
    end
  end
end
