# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Category::CreateBuilder do
  describe '.build' do
    subject(:created_category) { described_class.build(**params) }

    let(:params) do
      {
        scope: scope,
        name: name,
        kinds: kinds_data
      }.compact
    end

    let(:scope) { nil }
    let(:name) { 'Sample Category' }
    let(:kinds_data) { [] }

    context 'when no scope is provided' do
      it 'returns an instance of Oak::Category' do
        expect(created_category).to be_an_instance_of(Oak::Category)
      end

      it 'creates a valid category from attributes' do
        expect(created_category).to be_valid
      end
    end

    context 'when kinds are provided' do
      let!(:kind1) { create(:oak_kind, slug: 'kind-1') }
      let!(:kind2) { create(:oak_kind, slug: 'kind-2') }
      let(:kinds_data) { %w[kind-1 kind-2] }

      it 'creates a valid category' do
        expect(created_category).to be_valid
      end

      it 'associates the kinds with the category' do
        expect(created_category.kinds).to match_array([kind1, kind2])
      end

      it 'does not change the count of Oak::Kind' do
        expect { created_category }
          .not_to change(Oak::Kind, :count)
      end
    end

    context 'when the category is invalid' do
      let(:name) { nil }

      it 'returns an instance of Oak::Category' do
        expect(created_category).to be_an_instance_of(Oak::Category)
      end

      it 'does not raise any errors' do
        expect { created_category }.not_to raise_error
      end

      it 'marks the category as invalid' do
        expect(created_category).not_to be_valid
      end

      it 'adds validation errors to the category' do
        expect(created_category.tap(&:valid?).errors[:name]).to include("can't be blank")
      end
    end

    context 'when one of the kinds is invalid' do
      let!(:kind1) { create(:oak_kind, slug: 'kind-1') }
      let(:kinds_data) { %w[kind-1 kind-2] }

      it 'returns an instance of Oak::Category' do
        expect(created_category).to be_an_instance_of(Oak::Category)
      end

      it 'does not raise any errors' do
        expect { created_category }.not_to raise_error
      end

      it 'marks the category as invalid' do
        expect(created_category).not_to be_valid
      end

      it 'adds validation errors to the category' do
        expect(created_category.tap(&:valid?).errors[:category_kinds]).to include('is invalid')
      end
    end
  end
end