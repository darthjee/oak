# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Item, type: :model do
  subject(:item) { build(:oak_item, name:, user:, category:) }

  let(:name) { SecureRandom.hex(10) }
  let(:user) { build(:user) }
  let(:category) { build(:oak_category) }

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
  end
end
