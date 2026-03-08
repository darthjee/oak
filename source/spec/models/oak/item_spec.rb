# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Item, type: :model do
  subject(:item) do
    build(:oak_item, name:, description:, user:, category:, kind:, order:)
  end

  let(:name) { SecureRandom.hex(10) }
  let(:description) { 'Sample description' }
  let(:order) { 0 }
  let(:user) { build(:user) }
  let(:category) { build(:oak_category) }
  let(:kind) { build(:oak_kind) }

  describe 'validations' do
    it 'is valid with valid attributes' do
      expect(item).to be_valid
    end

    context 'when missing name' do
      let(:name) { nil }

      it 'is not valid without a name' do
        expect(item).not_to be_valid
      end

      it 'adds a proper error message' do
        expect(item.tap(&:valid?).errors[:name]).to include("can't be blank")
      end
    end

    context 'when name exceeds the maximum length' do
      let(:name) { 'a' * 101 }

      it 'is not valid' do
        expect(item).not_to be_valid
      end

      it 'adds an error on name' do
        expect(item.tap(&:valid?).errors[:name])
          .to include('is too long (maximum is 100 characters)')
      end
    end

    context 'when missing description' do
      let(:description) { nil }

      it 'is not valid without a description' do
        expect(item).not_to be_valid
      end

      it 'adds a proper error message' do
        expect(item.tap(&:valid?).errors[:description]).to include("can't be blank")
      end
    end

    context 'when order is nil' do
      it 'is valid' do
        expect(item).to be_valid
      end
    end

    context 'when order is within the valid range' do
      let(:order) { 0 }

      it 'is valid' do
        expect(item).to be_valid
      end

      context 'when order is at the lower limit' do
        let(:order) { -32_768 }

        it 'is valid' do
          expect(item).to be_valid
        end
      end

      context 'when order is at the upper limit' do
        let(:order) { 32_767 }

        it 'is valid' do
          expect(item).to be_valid
        end
      end
    end

    context 'when order is outside the valid range' do
      context 'when order is below the lower limit' do
        let(:order) { -32_769 }

        it 'is not valid' do
          expect(item).not_to be_valid
        end

        it 'adds a proper error message' do
          expect(item.tap(&:valid?).errors[:order])
            .to include('must be greater than or equal to -32768')
        end
      end

      context 'when order is above the upper limit' do
        let(:order) { 32_768 }

        it 'is not valid' do
          expect(item).not_to be_valid
        end

        it 'adds a proper error message' do
          expect(item.tap(&:valid?).errors[:order])
            .to include('must be less than or equal to 32767')
        end
      end
    end

    context 'when order is not an integer' do
      let(:order) { 'invalid' }

      it 'is not valid' do
        expect(item).not_to be_valid
      end

      it 'adds a proper error message' do
        expect(item.tap(&:valid?).errors[:order])
          .to include('is not a number')
      end
    end

    context 'when missing user' do
      let(:user) { nil }

      it 'is not valid without a user' do
        expect(item).not_to be_valid
      end

      it 'adds a proper error message' do
        expect(item.tap(&:valid?).errors[:user]).to include('must exist')
      end
    end

    context 'when missing category' do
      let(:category) { nil }

      it 'is not valid without a category' do
        expect(item).not_to be_valid
      end

      it 'adds a proper error message' do
        expect(item.tap(&:valid?).errors[:category]).to include('must exist')
      end
    end

    context 'when missing kind' do
      let(:kind) { nil }

      it 'is not valid without a kind' do
        expect(item).not_to be_valid
      end

      it 'adds a proper error message' do
        expect(item.tap(&:valid?).errors[:kind]).to include('must exist')
      end
    end
  end

  describe 'scopes' do
    describe '.visible_for' do
      let(:owner) { create(:user) }
      let(:other_user) { create(:user) }
      let(:category) { create(:oak_category) }
      let!(:visible_item) { create(:oak_item, category:, user: other_user, visible: true) }
      let!(:invisible_item) { create(:oak_item, category:, user: other_user, visible: false) }
      let!(:own_invisible_item) { create(:oak_item, category:, user: owner, visible: false) }

      context 'when no user is provided' do
        subject(:result) { described_class.visible_for }

        it 'returns only visible items' do
          expect(result).to include(visible_item)
        end

        it 'excludes invisible items' do
          expect(result).not_to include(invisible_item)
        end

        it 'excludes invisible items even for the owner' do
          expect(result).not_to include(own_invisible_item)
        end
      end

      context 'when a user is provided' do
        subject(:result) { described_class.visible_for(owner) }

        it 'returns visible items from other users' do
          expect(result).to include(visible_item)
        end

        it 'excludes invisible items from other users' do
          expect(result).not_to include(invisible_item)
        end

        it 'includes own invisible items' do
          expect(result).to include(own_invisible_item)
        end
      end
    end
  end

  describe 'associations' do
    describe '#main_photo' do
      context 'when there are no photos' do
        it 'returns nil' do
          expect(item.main_photo).to be_nil
        end
      end

      context 'when there are multiple photos and one has an order' do
        let!(:main_photo) { create(:oak_photo, item:, order: 1) }

        before do
          create(:oak_photo, item:, order: nil)
        end

        it 'returns the photo with the lowest order' do
          expect(item.main_photo).to eq(main_photo)
        end
      end

      context 'when there are two photos with order' do
        let!(:other_photo) { create(:oak_photo, item:, order: 2) }
        let!(:main_photo) do
          create(:oak_photo, item:, order: other_photo.order - 1)
        end

        it 'returns the photo with the lowest order' do
          expect(item.main_photo).to eq(main_photo)
        end
      end

      context 'when there are two photos without order' do
        let!(:main_photo) { create(:oak_photo, item:) }

        before do
          create(:oak_photo, item:)
        end

        it 'returns the photo with the lowest order' do
          expect(item.main_photo).to eq(main_photo)
        end
      end
    end
  end
end
