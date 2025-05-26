# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Category::FormDecorator do
  subject(:decorator) { described_class.new(category.tap(&:validate)) }

  let(:category) { build(:oak_category, name:) }
  let(:slug) { category.slug }
  let(:name) { 'Sample Category' }
  let(:snap_url) do
    [Settings.photos_server_url, 'category.png'].join('/')
  end
  let(:kinds) { [] }

  describe '#as_json' do
    let(:expected) do
      {
        name:,
        slug:,
        snap_url:,
        kinds:
      }.stringify_keys
    end

    context 'when there is no item' do
      it 'includes the name and kinds' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when there are kinds associated' do
      let!(:kinds_objects) { create_list(:oak_kind, 2) }
      let(:kinds) { kinds_objects.map(&:slug) }

      before do
        kinds_objects.each do |kind|
          create(:oak_category_kind, category:, kind:)
        end
      end

      it 'includes the kinds slugs' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when there are items with photo' do
      let!(:item) { create(:oak_item, category:) }
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

      it 'includes the name and kinds' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when category is invalid' do
      let(:name) { nil }
      let(:errors) { { name: ["can't be blank"], slug: ["can't be blank"] } }
      let(:expected) do
        {
          name:,
          slug:,
          snap_url:,
          kinds:,
          errors:
        }.deep_stringify_keys
      end

      it 'includes the name and kinds' do
        expect(decorator.as_json).to eq(expected)
      end
    end
  end
end