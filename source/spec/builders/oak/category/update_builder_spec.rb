# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Category::UpdateBuilder do
  describe '.build' do
    subject(:updated_category) { described_class.build(**params) }

    let(:params) do
      {
        category: category,
        name: name,
        kinds: kinds_data
      }.compact
    end

    let(:category) { create(:oak_category, name: 'Old Name') }
    let(:name) { 'Updated Name' }
    let(:kinds_data) { [] }
    let(:new_attributes) do
      {
        id: category.id,
        name: 'Updated Name',
        slug: 'updated_name'
      }.stringify_keys
    end

    context 'when the update is valid' do
      it 'updates the category attributes, including the slug' do
        expect { updated_category }
          .to change { category.reload.attributes.except('created_at', 'updated_at') }
          .to(new_attributes)
      end

      it 'does not change the count of Oak::Kind' do
        expect { updated_category }
          .not_to change(Oak::Kind, :count)
      end
    end

    context 'when kinds are provided' do
      let(:kinds_data) do
        [
          { name: 'Kind 1', slug: 'kind_1' },
          { name: 'Kind 2', slug: 'kind_2' }
        ]
      end

      before do
        create(:oak_kind, name: 'Kind 1')
        create(:oak_kind, name: 'Kind 2')
      end

      it 'creates new associations for the category' do
        expect { updated_category }
          .to change { category.kinds.count }.by(2)
      end

      it 'does not change the count of Oak::Kind' do
        expect { updated_category }
          .not_to change(Oak::Kind, :count)
      end
    end

    context 'when kinds are updated' do
      let!(:existing_kind) { create(:oak_kind, name: 'Kind 1') }
      let(:kinds_data) do
        [
          { name: 'Kind 1', slug: 'kind_1' },
          { name: 'Kind 2', slug: 'kind_2' }
        ]
      end

      before do
        create(:oak_category_kind, category:, kind: existing_kind)
        create(:oak_kind, name: 'Kind 2')
      end

      it 'adds new kinds to the category' do
        expect { updated_category }
          .to change { category.kinds.count }.by(1)
      end

      it 'keeps the existing kinds' do
        updated_category
        expect(category.kinds).to include(existing_kind)
      end

      it 'does not change the count of Oak::Kind' do
        expect { updated_category }
          .not_to change(Oak::Kind, :count)
      end
    end

    context 'when kinds are deleted' do
      let!(:existing_kind) { create(:oak_kind, name: 'Kind 1') }
      let!(:removed_kind) { create(:oak_kind, name: 'Kind 2') }
      let(:kinds_data) do
        [
          { name: 'Kind 1', slug: 'kind_1' }
        ]
      end

      before do
        create(:oak_category_kind, category:, kind: removed_kind)
        create(:oak_category_kind, category:, kind: existing_kind)
      end

      it 'removes the kinds not in the payload' do
        expect { updated_category }
          .to change { category.kinds.count }.by(-1)
      end

      it 'keeps the kind in the payload' do
        updated_category
        expect(category.kinds).to include(existing_kind)
      end

      it 'removes the kind not in the payload' do
        updated_category
        expect(category.kinds).not_to include(removed_kind)
      end

      it 'does not change the count of Oak::Kind' do
        expect { updated_category }
          .not_to change(Oak::Kind, :count)
      end
    end

    context 'when the update is invalid' do
      let(:name) { nil }
      let!(:existing_kind) { create(:oak_kind, name: 'Kind 1') }
      let(:kinds_data) do
        [
          { name: 'Kind 1', slug: 'kind_1' }
        ]
      end

      before { create(:oak_category_kind, category:, kind: existing_kind) }

      it 'does not update the category' do
        expect { updated_category }
          .not_to(change { category.reload.attributes })
      end

      it 'does not update the kinds' do
        expect { updated_category }
          .not_to(change { category.kinds.count })
      end

      it 'does not change the count of Oak::Kind' do
        expect { updated_category }
          .not_to change(Oak::Kind, :count)
      end

      it 'adds validation errors to the category' do
        updated_category
        expect(category.errors[:name]).to include("can't be blank")
      end
    end
  end
end
