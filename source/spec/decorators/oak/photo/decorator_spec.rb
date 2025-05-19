# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Photo::Decorator do
  subject(:decorator) { described_class.new(photo) }

  let(:photo) { build(:oak_photo, file_name:, item:) }
  let(:file_name) { 'photo.jpg' }
  let(:item) { build(:oak_item, id: 1, user:) }
  let(:user) { build(:user, id: 42) }

  let(:snap_url) do
    [
      Settings.photos_server_url,
      :snaps,
      :users,
      user.id,
      :items,
      item.id,
      file_name
    ].join('/')
  end

  let(:photo_url) do
    [
      Settings.photos_server_url,
      :photos,
      :users,
      user.id,
      :items,
      item.id,
      file_name
    ].join('/')
  end

  describe '#as_json' do
    let(:expected) do
      {
        snap_url:,
        photo_url:
      }.stringify_keys
    end

    context 'when the photo is valid' do
      it 'includes the snap_url and photo_url' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when the photo is invalid' do
      let(:file_name) { nil }
      let(:errors) { { file_name: ["can't be blank"] } }
      let(:expected) do
        {
          snap_url:,
          photo_url:,
          errors:
        }.deep_stringify_keys
      end

      it 'includes the errors' do
        photo.validate # Trigger validations
        expect(decorator.as_json).to eq(expected)
      end
    end
  end
end