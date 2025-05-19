# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Link, type: :model do
  subject(:link) { build(:oak_link, item:, order:, url:, text:) }

  let(:item) { build(:oak_item) }
  let(:order) { 10 }
  let(:url) { 'https://example.com' }
  let(:text) { 'Example Link' }

  describe 'validations' do
    context 'with valid attributes' do
      it 'is valid' do
        expect(link).to be_valid
      end
    end

    context 'when item is missing' do
      let(:item) { nil }

      it 'is not valid without an item' do
        expect(link).not_to be_valid
      end

      it 'adds an error on item' do
        link.valid? # Trigger validations
        expect(link.errors[:item]).to include("can't be blank")
      end
    end

    context 'when url is missing' do
      let(:url) { nil }

      it 'is not valid without a url' do
        expect(link).not_to be_valid
      end

      it 'adds an error on url' do
        link.valid? # Trigger validations
        expect(link.errors[:url]).to include("can't be blank")
      end
    end

    context 'when url is invalid' do
      let(:url) { 'invalid-url' }

      it 'is not valid with an invalid url' do
        expect(link).not_to be_valid
      end

      it 'adds an error on url' do
        link.valid? # Trigger validations
        expect(link.errors[:url]).to include('is invalid')
      end
    end

    context 'when text is missing' do
      let(:text) { nil }

      it 'is not valid without text' do
        expect(link).not_to be_valid
      end

      it 'adds an error on text' do
        link.valid? # Trigger validations
        expect(link.errors[:text]).to include("can't be blank")
      end
    end

    context 'when text exceeds the maximum length' do
      let(:text) { 'a' * 256 }

      it 'is not valid' do
        expect(link).not_to be_valid
      end

      it 'adds an error on text' do
        link.valid? # Trigger validations
        expect(link.errors[:text]).to include('is too long (maximum is 255 characters)')
      end
    end

    context 'when order is less than -127' do
      let(:order) { -128 }

      it 'is not valid' do
        expect(link).not_to be_valid
      end

      it 'adds an error on order' do
        link.valid? # Trigger validations
        expect(link.errors[:order]).to include('must be greater than or equal to -127')
      end
    end

    context 'when order is greater than 128' do
      let(:order) { 129 }

      it 'is not valid' do
        expect(link).not_to be_valid
      end

      it 'adds an error on order' do
        link.valid? # Trigger validations
        expect(link.errors[:order]).to include('must be less than or equal to 128')
      end
    end

    context 'when order is nil' do
      let(:order) { nil }

      it 'is valid' do
        expect(link).to be_valid
      end
    end
  end
end