# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Kind::Decorator do
  subject(:decorator) { described_class.new(kind.tap(&:validate)) }

  let(:kind) { build(:oak_kind, name:) }
  let(:slug) { kind.slug }
  let(:name) { 'Sample Kind' }
  let(:snap_url) do
    [Settings.photos_server_url, 'kind.png'].join('/')
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
      let!(:item) { create(:oak_item, kind:) }
      let(:user) { item.user }

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

    context 'when kind is invalid' do
      let(:name) { nil }
      let(:errors) do
        { name: ["can't be blank"], slug: ["can't be blank"] }
      end
      let(:expected) do
        {
          name:,
          slug:,
          snap_url:,
          errors:
        }.deep_stringify_keys
      end

      it 'includes the errors' do
        expect(decorator.as_json).to eq(expected)
      end
    end
  end
end
