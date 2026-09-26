# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Photo::CreateBuilder do
  describe '.build' do
    subject(:created_photo) { described_class.build(**params) }

    let(:params) do
      {
        scope: scope,
        file_name: file_name
      }.compact
    end

    let(:item) { create(:oak_item) }
    let(:scope) { item.photos }
    let(:file_name) { 'cat.jpg' }

    it 'returns an unsaved instance of Oak::Photo' do
      expect(created_photo).to be_an_instance_of(Oak::Photo)
    end

    it 'builds the photo on the given scope' do
      expect(created_photo.item).to eq(item)
    end

    it 'is not persisted' do
      expect(created_photo).not_to be_persisted
    end

    it 'keeps the original extension and appends a UUID suffix' do
      expect(created_photo.file_name).to match(/\Acat-[0-9a-f-]{36}\.jpg\z/)
    end

    it 'defaults ready to false' do
      expect(created_photo.ready).to be(false)
    end

    it 'marks the photo as migrated' do
      expect(created_photo).to be_migration_migrated
    end

    context 'when called twice with the same file_name on the same scope' do
      it 'generates different file_name values' do
        first_file_name = described_class.build(**params).file_name
        second_file_name = described_class.build(**params).file_name

        expect(first_file_name).not_to eq(second_file_name)
      end

      it 'saves both photos successfully' do
        first_photo = described_class.build(**params)
        second_photo = described_class.build(**params)

        first_photo.save!
        expect { second_photo.save! }.not_to raise_error
      end
    end

    context 'when the file_name stem contains characters outside [a-zA-Z0-9_-]' do
      let(:file_name) { 'my cat photo..png' }

      it 'sanitizes the stem, keeping only the last extension' do
        expect(created_photo.file_name).to match(/\Amy_cat_photo_-[0-9a-f-]{36}\.png\z/)
      end
    end

    context 'when the file_name has no stem at all' do
      let(:file_name) { '' }

      it 'falls back to a fixed placeholder stem' do
        expect(created_photo.file_name).to match(/\Aphoto-[0-9a-f-]{36}\z/)
      end
    end
  end
end
