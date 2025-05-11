# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Category::IndexDecorator do
  subject(:decorator) { described_class.new(category) }

  let(:category) { build(:oak_category, name:) }
  let(:slug) { category.slug }
  let(:name) { 'Sample Category' }

  describe '#as_json' do
    let(:expected) do
      {
        name:,
        slug:,
        snap_url:
      }.stringify_keys
    end

    context 'when there is no item' do
      let(:snap_url) do
        [Settings.photos_server_url, 'category.png'].join('/')
      end

      it 'includes the name' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when there are items' do
      let!(:item) { create(:oak_item, category:) }
      let(:user) { item.user }

      let(:snap_url) do
        [
          Settings.photos_server_url, user.id, :snaps, :items, slug, "#{item.id}.png"
        ].join('/')
      end

      it 'includes the name' do
        expect(decorator.as_json).to eq(expected)
      end
    end
  end
end
