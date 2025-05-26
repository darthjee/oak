# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::CategoryKind, type: :model do
  subject(:category_kind) { build(:oak_category_kind, category:, kind:) }

  let(:category) { build(:oak_category) }
  let(:kind) { build(:oak_kind) }

  describe 'validations' do
    context 'with valid attributes' do
      it 'is valid' do
        expect(category_kind).to be_valid
      end
    end

    context 'when category is missing' do
      let(:category) { nil }

      it 'is not valid without a category' do
        expect(category_kind).not_to be_valid
      end

      it 'adds an error on category' do
        category_kind.valid? # Trigger validations
        expect(category_kind.errors[:category]).to include("can't be blank")
      end
    end

    context 'when kind is missing' do
      let(:kind) { nil }

      it 'is not valid without a kind' do
        expect(category_kind).not_to be_valid
      end

      it 'adds an error on kind' do
        category_kind.valid? # Trigger validations
        expect(category_kind.errors[:kind]).to include("can't be blank")
      end
    end

    context 'when the combination of category and kind is not unique' do
      before { create(:oak_category_kind, category:, kind:) }

      it 'is not valid' do
        expect(category_kind).not_to be_valid
      end

      it 'adds an error on kind' do
        category_kind.valid? # Trigger validations
        expect(category_kind.errors[:kind]).to include('has already been associated with this category')
      end
    end
  end
end