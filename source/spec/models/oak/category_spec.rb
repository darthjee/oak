# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Category, type: :model do
  subject(:category) { build(:oak_category, name:) }

  let(:name) { SecureRandom.hex(10) }

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

    context 'when name exceeds the maximum length' do
      let(:name) { 'a' * 41 } # 41 characters

      it 'is not valid' do
        expect(category).not_to be_valid
      end

      it 'adds an error on name' do
        category.valid? # Trigger validations
        expect(category.errors[:name]).to include('is too long (maximum is 40 characters)')
      end
    end

    context 'when slug is not unique' do
      let(:name) { "NAME #{SecureRandom.hex(10)}" }

      before { create(:oak_category, name: category.name.downcase) }

      it 'is not valid' do
        expect(category).not_to be_valid
      end

      it 'adds an error on slug' do
        category.valid? # Trigger validations
        expect(category.errors[:slug]).to include('has already been taken')
      end
    end
  end

  describe 'slug behavior' do
    context 'when name is updated' do
      let(:new_name) { SecureRandom.hex(10) }

      it 'updates the slug to match the new name' do
        expect { category.name = new_name }
          .to change(category, :slug).to(new_name.underscore)
      end
    end

    context 'when name has spaces' do
      let(:new_name) { 'New  Name' }

      it 'updates the slug to match the new name' do
        expect { category.name = new_name }
          .to change(category, :slug).to('new_name')
      end
    end

    context 'when name is updated to nil' do
      let(:new_name) { nil }

      it 'updates the slug to nil' do
        expect { category.name = new_name }
          .to change(category, :slug).to(nil)
      end
    end
  end

  describe 'associations' do
    describe '#main_photo' do
      context 'when there are no items' do
        it 'returns nil' do
          expect(category.main_photo).to be_nil
        end
      end

      context 'when there are items with photos' do
        let!(:item_with_photo) { create(:oak_item, category:) }
        let!(:main_photo) { create(:oak_photo, item: item_with_photo) }

        it 'returns the main photo of the first item' do
          expect(category.main_photo).to eq(main_photo)
        end
      end

      context 'when there are items with and without photos' do
        let!(:items) { create_list(:oak_item, 3, category:) }
        let!(:main_photo) { create(:oak_photo, item: items.sample) }

        it 'returns the main photo of the first item with a photo' do
          expect(category.main_photo).to eq(main_photo)
        end
      end
    end
  end
end
