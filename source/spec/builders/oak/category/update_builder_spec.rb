# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Category::UpdateBuilder do
  describe '.build' do
    subject(:updated_category) { described_class.build(**params) }

    let(:params) do
      {
        category: category,
        name: name,
        description: description,
        kinds: kinds_data
      }.compact
    end

    let(:category) { create(:oak_category, name: 'Old Name', description: 'Old Description') }
    let(:name) { 'Updated Name' }
    let(:description) { 'Updated Description' }
    let(:kinds_data) { [] }
    let(:new_attributes) do
      {
        id: category.id,
        name: 'Updated Name',
        description: 'Updated Description'
      }.stringify_keys
    end

    context 'when the update is valid' do
      it 'updates the category attributes' do
        expect { updated_category }
          .to change { category.reload.attributes.except('created_at', 'updated_at') }
          .to(new_attributes)
      end
    end

    context 'when there are kinds data' do
      let!(:kind1) { create(:oak_kind, slug: 'kind-1') }
      let!(:kind2) { create(:oak_kind, slug: 'kind-2') }
      let(:kinds_data) { %w[kind-1 kind-2] }

      it 'creates new associations for the category' do
        expect { updated_category }
          .to change { category.kinds.count }.by(2)
      end
    end

    context 'when kinds are updated' do
      let!(:existing_kind) { create(:oak_kind, slug: 'kind-1') }
      let!(:new_kind) { create(:oak_kind, slug: 'kind-2') }
      let!(:existing_category_kind) { create(:oak_category_kind, category:, kind: existing_kind) }
      let(:kinds_data) { %w[kind-1 kind-2] }

      it 'adds new kinds to the category' do
        expect { updated_category }
          .to change { category.kinds.count }.by(1)
      end

      it 'keeps the existing kinds' do
        updated_category
        expect(category.kinds).to include(existing_kind)
      end
    end

    context 'when kinds are deleted' do
      let!(:existing_kind) { create(:oak_kind, slug: 'kind-1') }
      let!(:removed_kind) { create(:oak_kind, slug: 'kind-2') }
      let!(:existing_category_kind) { create(:oak_category_kind, category:, kind: existing_kind) }
      let!(:removed_category_kind) { create(:oak_category_kind, category:, kind: removed_kind) }
      let(:kinds_data) { %w[kind-1] }

      it 'removes the kinds not in the payload' do
        expect { updated_category }
          .to change { category.kinds.count }.by(-1)
      end

      it 'keeps the kinds in the payload' do
        updated_category
        expect(category.kinds).to include(existing_kind)
        expect(category.kinds).not_to include(removed_kind)
      end
    end

    context 'when the update is invalid' do
      let(:name) { nil }
      let!(:existing_kind) { create(:oak_kind, slug: 'kind-1') }
      let!(:existing_category_kind) { create(:oak_category_kind, category:, kind: existing_kind) }
      let(:kinds_data) { %w[kind-1] }

      it 'does not update the category' do
        expect { updated_category }
          .not_to(change { category.reload.attributes })
      end

      it 'does not update the kinds' do
        expect { updated_category }
          .not_to(change { category.kinds.count })
      end

      it 'adds validation errors to the category' do
        updated_category
        expect(category.errors[:name]).to include("can't be blank")
      end
    end
  end
end