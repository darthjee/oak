# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Item::IndexDecorator do
  subject(:decorator) { described_class.new(item.tap(&:validate)) }

  let(:item) { build(:oak_item, name:, description:) }
  let(:name) { 'Sample Item' }
  let(:description) { 'Sample Description' }
  let(:category_slug) { item.category.slug }
  let(:kind_slug) { item.kind.slug }
  let(:user) { item.user }
  let(:snap_url) do
    [Settings.photos_server_url, 'category.png'].join('/')
  end
  let(:main_link) { nil }

  describe '#as_json' do
    let(:expected) do
      {
        id: item.id,
        name:,
        description:,
        category_slug:,
        kind_slug:,
        snap_url:,
        link: main_link
      }.stringify_keys
    end

    context 'when the item has no photos' do
      it 'includes the id and name' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when the item has a main photo' do
      let!(:photo) { create(:oak_photo, item:) }
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

      it 'includes the id and name' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when the item has links' do
      let!(:second_link) { create(:oak_link, item:, order: 1, url: 'https://example.com/1') }
      let(:main_link) { Oak::Link::Decorator.new(second_link).as_json }

      let(:expected) do
        {
          id: item.id,
          name:,
          description:,
          category_slug:,
          kind_slug:,
          snap_url:,
          link: main_link
        }.deep_stringify_keys
      end

      before { create(:oak_link, item:, order: 2, url: 'https://example.com/2') }

      it 'includes the main link' do
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
          category_slug:,
          kind_slug:,
          snap_url:,
          errors:,
          link: main_link
        }.deep_stringify_keys
      end

      it 'includes the id and name' do
        expect(decorator.as_json).to eq(expected)
      end
    end
  end
end
