# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Photo do
  subject(:photo) { build(:oak_photo, item:, order:, file_name:) }

  let(:item) { build(:oak_item) }
  let(:order) { 10 }
  let(:file_name) { 'example.jpg' }

  describe 'validations' do
    context 'with valid attributes' do
      it 'is valid' do
        expect(photo).to be_valid
      end
    end

    context 'when item is missing' do
      let(:item) { nil }

      it 'is not valid without an item' do
        expect(photo).not_to be_valid
      end

      it 'adds an error on item' do
        photo.valid? # Trigger validations
        expect(photo.errors[:item]).to include('must exist')
      end
    end

    context 'when file_name is missing' do
      let(:file_name) { nil }

      it 'is not valid without a file_name' do
        expect(photo).not_to be_valid
      end

      it 'adds an error on file_name' do
        photo.valid? # Trigger validations
        expect(photo.errors[:file_name]).to include("can't be blank")
      end
    end

    context 'when file_name is not unique within the same item' do
      before { create(:oak_photo, item:, file_name:) }

      it 'is not valid' do
        expect(photo).not_to be_valid
      end

      it 'adds an error on file_name' do
        photo.valid? # Trigger validations
        expect(photo.errors[:file_name]).to include('has already been taken')
      end
    end

    context 'when file_name is unique across different items' do
      before { create(:oak_photo, item: create(:oak_item), file_name:) }

      it 'is valid' do
        expect(photo).to be_valid
      end
    end

    context 'when order is less than 0' do
      let(:order) { -128 }

      it 'is not valid' do
        expect(photo).not_to be_valid
      end

      it 'adds an error on order' do
        photo.valid? # Trigger validations
        expect(photo.errors[:order]).to include('must be greater than or equal to -127')
      end
    end

    context 'when order is greater than 128' do
      let(:order) { 129 }

      it 'is not valid' do
        expect(photo).not_to be_valid
      end

      it 'adds an error on order' do
        photo.valid? # Trigger validations
        expect(photo.errors[:order]).to include('must be less than or equal to 128')
      end
    end

    context 'when order is nil' do
      let(:order) { nil }

      it 'is valid' do
        expect(photo).to be_valid
      end
    end
  end

  describe 'migration_status' do
    it 'defaults to pending' do
      expect(described_class.new.migration_status).to eq('pending')
    end

    it 'declares the string-backed enum values' do
      expected = %w[pending migrating migrated missing].index_by(&:itself)

      expect(described_class.migration_statuses).to eq(expected)
    end

    it 'exposes prefixed predicates' do
      photo.migration_status = :migrating
      expect(photo).to be_migration_migrating
    end

    it 'exposes prefixed scopes' do
      migrated = create(:oak_photo, migration_status: :migrated)
      create(:oak_photo)

      expect(described_class.migration_migrated).to eq([migrated])
    end
  end

  describe 'MIGRATION_CLAIM_TIMEOUT' do
    it 'is five minutes' do
      expect(described_class::MIGRATION_CLAIM_TIMEOUT).to eq(5.minutes)
    end
  end

  describe '.uuid_file_name?' do
    let(:uuid) { SecureRandom.uuid }

    it 'returns true for a UUID-suffixed name' do
      expect(described_class.uuid_file_name?("photo-#{uuid}.jpg")).to be(true)
    end

    it 'returns true for an uppercase UUID-suffixed name' do
      expect(described_class.uuid_file_name?("photo-#{uuid.upcase}.JPG")).to be(true)
    end

    it 'returns false for a legacy name' do
      expect(described_class.uuid_file_name?('photo.jpg')).to be(false)
    end

    it 'returns false when the UUID is not before the extension' do
      expect(described_class.uuid_file_name?("#{uuid}-photo.jpg")).to be(false)
    end

    it 'returns false when there is no extension' do
      expect(described_class.uuid_file_name?("photo-#{uuid}")).to be(false)
    end

    it 'returns false for nil' do
      expect(described_class.uuid_file_name?(nil)).to be(false)
    end
  end
end
