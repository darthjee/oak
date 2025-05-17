# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Item::Decorator do
  subject(:decorator) { described_class.new(item) }

  let(:item) { create(:oak_item, name:) }
  let(:name) { 'Sample Item' }
  let(:category_slug) { item.category.slug }
  let(:kind_slug) { item.kind.slug }
  let(:user) { item.user }

  describe '#as_json' do
    let(:expected) do
      {
        id: item.id,
        name:,
        category_slug:,
        kind_slug:,
        snap_url:
      }.stringify_keys
    end

    context 'when the item has no photos' do
      let(:snap_url) do
        [Settings.photos_server_url, 'category.png'].join('/')
      end

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
  end
end
