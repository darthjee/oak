# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Kind, type: :model do
  subject(:kind) { build(:oak_kind, name:) }

  let(:name) { SecureRandom.hex(10) }

  describe 'validations' do
    context 'with valid attributes' do
      it 'is valid' do
        expect(kind).to be_valid
      end
    end

    context 'when name is missing' do
      let(:name) { nil }

      it 'is not valid' do
        expect(kind).not_to be_valid
      end

      it 'adds an error on name' do
        kind.valid? # Trigger validations
        expect(kind.errors[:name]).to include("can't be blank")
      end
    end

    context 'when name exceeds the maximum length' do
      let(:name) { 'a' * 41 } # 41 characters

      it 'is not valid' do
        expect(kind).not_to be_valid
      end

      it 'adds an error on name' do
        kind.valid? # Trigger validations
        expect(kind.errors[:name]).to include('is too long (maximum is 40 characters)')
      end
    end

    context 'when slug is not unique' do
      let(:name) { "NAME #{SecureRandom.hex(10)}" }

      before { create(:oak_kind, name: kind.name.downcase) }

      it 'is not valid' do
        expect(kind).not_to be_valid
      end

      it 'adds an error on slug' do
        kind.valid? # Trigger validations
        expect(kind.errors[:slug]).to include('has already been taken')
      end
    end
  end

  describe 'slug behavior' do
    context 'when name is updated' do
      let(:new_name) { SecureRandom.hex(10) }

      it 'updates the slug to match the new name' do
        expect { kind.name = new_name }
          .to change(kind, :slug).to(new_name.underscore)
      end
    end

    context 'when name is updated to nil' do
      let(:new_name) { nil }

      it 'updates the slug to nil' do
        expect { kind.name = new_name }
          .to change(kind, :slug).to(nil)
      end
    end
  end
end
