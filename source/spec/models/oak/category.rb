# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Category, type: :model do
  subject(:category) { build(:oak_category, name:, slug:) }

  let(:name) { SecureRandom.hex(10) }
  let(:slug) { SecureRandom.hex(10) }

  describe 'validations' do
    context 'with valid attributes' do
      it 'is valid' do
        expect(category).to be_valid
      end
    end

    context 'when name is missing' do
      let(:name) { nil }

      it 'is not valid' do
        expect(category).not_to be_valid
      end

      it 'adds an error on name' do
        category.valid? # Trigger validations
        expect(category.errors[:name]).to include("can't be blank")
      end
    end

    context 'when slug is missing' do
      let(:slug) { nil }

      it 'is not valid' do
        expect(category).not_to be_valid
      end

      it 'adds an error on slug' do
        category.valid? # Trigger validations
        expect(category.errors[:slug]).to include("can't be blank")
      end
    end

    context 'when name is not unique' do
      before { create(:oak_category, name:) }

      it 'is not valid' do
        expect(category).not_to be_valid
      end

      it 'adds an error on name' do
        category.valid? # Trigger validations
        expect(category.errors[:name]).to include('has already been taken')
      end
    end

    context 'when slug is not unique' do
      before { create(:oak_category, slug:) }

      it 'is not valid' do
        expect(category).not_to be_valid
      end

      it 'adds an error on slug' do
        category.valid? # Trigger validations
        expect(category.errors[:slug]).to include('has already been taken')
      end
    end
  end
end
