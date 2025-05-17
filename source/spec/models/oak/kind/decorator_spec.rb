# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Kind::Decorator do
  subject(:decorator) { described_class.new(kind) }

  let(:kind) { build(:oak_kind, name:) }
  let(:slug) { kind.slug }
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
        [Settings.photos_server_url, 'kind.png'].join('/')
      end

      it 'includes the name' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when there are items without photos' do
      let!(:item) { create(:oak_item, kind:) }
      let(:user) { item.user }

      let(:snap_url) do
        [Settings.photos_server_url, 'kind.png'].join('/')
      end

      it 'includes the name' do
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

      it 'includes the name' do
        expect(decorator.as_json).to eq(expected)
      end
    end
  end
end
