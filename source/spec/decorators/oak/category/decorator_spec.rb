# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Category::Decorator do
  subject(:decorator) { described_class.new(category.tap(&:validate)) }

  let(:category) { build(:oak_category, name:) }
  let(:slug) { category.slug }
  let(:name) { 'Sample Category' }
  let(:snap_url) do
    [Settings.photos_server_url, 'category.png'].join('/')
  end

  describe '#as_json' do
    let(:expected) do
      {
        name:,
        slug:,
        snap_url:
      }.stringify_keys
    end

    context 'when there is no item' do
      it 'includes the name' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when there are items without photos' do
      let!(:item) { create(:oak_item, category:) }
      let(:user) { item.user }

      let(:snap_url) do
        [Settings.photos_server_url, 'category.png'].join('/')
      end

      it 'includes the name' do
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

      it 'includes the name' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when category is invalid' do
      let(:name) { nil }
      let(:errors) { { name: ["can't be blank"], slug: ["can't be blank"]} }
      let(:expected) do
        {
          name:,
          slug:,
          snap_url:,
          errors:
        }.deep_stringify_keys
      end

      it 'includes the name' do
        expect(decorator.as_json).to eq(expected)
      end
    end
  end
end
