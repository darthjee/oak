require 'spec_helper'

RSpec.describe Oak::Photo, type: :model do
  subject(:photo) { build(:oak_photo, item:, order:) }

  let(:item) { build(:oak_item) }
  let(:order) { 10 }

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
        expect(photo.errors[:item]).to include("can't be blank")
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
end