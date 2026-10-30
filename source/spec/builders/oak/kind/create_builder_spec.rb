# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Kind::CreateBuilder do
  describe '.build' do
    subject(:created_kind) { described_class.build(**params) }

    let(:params) do
      {
        scope: scope,
        name: name,
        categories: categories_data
      }.compact
    end

    let(:scope) { nil }
    let(:name) { 'Sample Kind' }
    let(:categories_data) { nil }

    context 'when no categories are provided' do
      it 'returns an instance of Oak::Kind' do
        expect(created_kind).to be_an_instance_of(Oak::Kind)
      end

      it 'persists the kind' do
        expect { created_kind }.to change(Oak::Kind, :count).by(1)
      end

      it 'generates the slug based on the name' do
        expect(created_kind.slug).to eq('sample_kind')
      end

      it 'does not link any category' do
        expect(created_kind.categories).to be_empty
      end
    end

    context 'when an empty categories list is provided' do
      let(:categories_data) { [] }

      it 'persists the kind' do
        expect { created_kind }.to change(Oak::Kind, :count).by(1)
      end

      it 'does not create any link' do
        expect { created_kind }.not_to change(Oak::CategoryKind, :count)
      end
    end

    context 'when categories are provided' do
      before do
        create(:oak_category, name: 'Category 1')
        create(:oak_category, name: 'Category 2')
        create(:oak_category, name: 'Category 3')
      end

      let(:categories_data) do
        [
          { slug: 'category_1' },
          { slug: 'category_2' }
        ]
      end

      it 'creates a valid kind' do
        expect(created_kind).to be_valid
      end

      it 'associates the categories with the kind' do
        expect(created_kind.reload.categories.map(&:slug))
          .to contain_exactly('category_1', 'category_2')
      end

      it 'does not change the count of Oak::Category' do
        expect { created_kind }.not_to change(Oak::Category, :count)
      end
    end

    context 'when unknown category slugs are provided' do
      before { create(:oak_category, name: 'Category 1') }

      let(:categories_data) do
        [
          { slug: 'category_1' },
          { slug: 'unknown_category' }
        ]
      end

      it 'persists the kind' do
        expect { created_kind }.to change(Oak::Kind, :count).by(1)
      end

      it 'ignores the unknown slugs' do
        expect(created_kind.reload.categories.map(&:slug))
          .to contain_exactly('category_1')
      end
    end

    context 'when a scope is provided' do
      let(:scope) { Oak::Kind.where(name: 'Sample Kind') }

      it 'builds the kind from the scope' do
        expect(created_kind).to be_persisted
      end
    end

    context 'when the kind is invalid' do
      let(:name) { nil }
      let(:categories_data) { [{ slug: 'category_1' }] }

      before { create(:oak_category, name: 'Category 1') }

      it 'returns an instance of Oak::Kind' do
        expect(created_kind).to be_an_instance_of(Oak::Kind)
      end

      it 'does not raise any errors' do
        expect { created_kind }.not_to raise_error
      end

      it 'does not persist the kind' do
        expect { created_kind }.not_to change(Oak::Kind, :count)
      end

      it 'does not persist any link' do
        expect { created_kind }.not_to change(Oak::CategoryKind, :count)
      end

      it 'adds validation errors to the kind' do
        expect(created_kind.errors[:name]).to include("can't be blank")
      end
    end
  end
end
