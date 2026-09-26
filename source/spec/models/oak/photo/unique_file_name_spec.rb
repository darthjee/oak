# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Photo::UniqueFileName do
  describe '.build' do
    subject(:unique_file_name) { described_class.build(file_name) }

    let(:file_name) { 'cat.jpg' }

    it 'keeps the stem and extension and appends a UUID' do
      expect(unique_file_name).to match(/\Acat-\h{8}-\h{4}-\h{4}-\h{4}-\h{12}\.jpg\z/)
    end

    it 'produces a name recognised as a UUID file name' do
      expect(Oak::Photo.uuid_file_name?(unique_file_name)).to be(true)
    end

    it 'generates a different name on each call' do
      expect(unique_file_name).not_to eq(described_class.build(file_name))
    end

    context 'when the stem contains characters outside [a-zA-Z0-9_-]' do
      let(:file_name) { 'my cat photo..png' }

      it 'sanitizes the stem, keeping only the last extension' do
        expect(unique_file_name).to match(/\Amy_cat_photo_-[0-9a-f-]{36}\.png\z/)
      end
    end

    context 'when the file name has no stem' do
      let(:file_name) { '' }

      it 'falls back to the photo stem' do
        expect(unique_file_name).to match(/\Aphoto-[0-9a-f-]{36}\z/)
      end
    end

    context 'when the file name is nil' do
      let(:file_name) { nil }

      it 'falls back to the photo stem' do
        expect(unique_file_name).to match(/\Aphoto-[0-9a-f-]{36}\z/)
      end
    end

    context 'when the file name has no extension' do
      let(:file_name) { 'cat' }

      it 'does not add an extension' do
        expect(unique_file_name).to match(/\Acat-[0-9a-f-]{36}\z/)
      end
    end
  end
end
