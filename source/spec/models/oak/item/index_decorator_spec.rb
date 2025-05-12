# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Item::IndexDecorator do
  subject(:decorator) { described_class.new(item) }

  let(:item) { create(:oak_item, name:) }
  let(:name) { 'Sample Item' }
  let(:user) { item.user }

  describe '#as_json' do
    let(:expected) do
      {
        id: item.id,
        name:,
        snap_url:
      }.stringify_keys
    end

    context "when the item has no photos" do
      let(:snap_url) do
        [
          Settings.photos_server_url,
          user.id,
          :snaps,
          :items,
          item.category.slug,
          "#{item.id}.png"
        ].join('/')
      end

      it 'includes the id and name' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context "when the item has a main photo" do
      let!(:photo) { create(:oak_photo, item:) }
      let(:snap_url) do
        [
          Settings.photos_server_url,
          user.id,
          :snaps,
          :items,
          item.category.slug,
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
