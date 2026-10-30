# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Kind::UpdateBuilder do
  describe '.build' do
    subject(:updated_kind) { described_class.build(**params) }

    let(:params) do
      {
        kind: kind,
        name: name,
        categories: categories_data
      }.compact
    end

    let(:kind) { create(:oak_kind, name: 'Old Name') }
    let(:name) { 'Updated Name' }
    let(:categories_data) { nil }
    let(:linked_slugs) { kind.reload.categories.map(&:slug) }

    context 'when only the name is updated' do
      let(:new_attributes) do
        {
          id: kind.id,
          name: 'Updated Name',
          slug: 'updated_name'
        }.stringify_keys
      end

      it 'updates the kind attributes, including the slug' do
        expect { updated_kind }
          .to change { kind.reload.attributes.slice('id', 'name', 'slug') }
          .to(new_attributes)
      end
    end

    context 'when categories key is not given' do
      let(:category) { create(:oak_category, name: 'Category 1') }

      before { create(:oak_category_kind, category:, kind:) }

      it 'leaves the links untouched' do
        expect { updated_kind }.not_to(change { kind.reload.categories.to_a })
      end
    end

    context 'when categories is an empty list' do
      let(:categories_data) { [] }

      before do
        create(:oak_category_kind, kind:)
        create(:oak_category_kind, kind:)
      end

      it 'unlinks every category' do
        expect { updated_kind }
          .to change { kind.reload.categories.count }.from(2).to(0)
      end

      it 'does not destroy the categories' do
        expect { updated_kind }.not_to change(Oak::Category, :count)
      end
    end

    context 'when categories are added' do
      let(:categories_data) { [{ slug: 'category_1' }, { slug: 'category_2' }] }

      before do
        create(:oak_category, name: 'Category 1')
        create(:oak_category, name: 'Category 2')
      end

      it 'links the new categories' do
        updated_kind
        expect(linked_slugs).to contain_exactly('category_1', 'category_2')
      end
    end

    context 'when categories are kept, added and removed' do
      let!(:kept_category) { create(:oak_category, name: 'Category 1') }
      let!(:removed_category) { create(:oak_category, name: 'Category 2') }
      let(:categories_data) do
        [
          { slug: 'category_1' },
          { slug: 'category_3' },
          { slug: 'unknown_category' }
        ]
      end

      before do
        create(:oak_category, name: 'Category 3')
        create(:oak_category_kind, category: kept_category, kind:)
        create(:oak_category_kind, category: removed_category, kind:)
      end

      it 'syncs the links with the payload, ignoring unknown slugs' do
        updated_kind
        expect(linked_slugs).to contain_exactly('category_1', 'category_3')
      end

      it 'keeps the existing link record' do
        link = Oak::CategoryKind.find_by(category: kept_category, kind:)
        updated_kind
        expect(Oak::CategoryKind.exists?(link.id)).to be(true)
      end

      it 'does not change the count of Oak::Category' do
        expect { updated_kind }.not_to change(Oak::Category, :count)
      end
    end

    context 'when the update is invalid' do
      let(:name) { nil }
      let!(:existing_category) { create(:oak_category, name: 'Category 1') }
      let(:categories_data) { [{ slug: 'category_2' }] }

      before do
        create(:oak_category, name: 'Category 2')
        create(:oak_category_kind, category: existing_category, kind:)
      end

      it 'does not raise any errors' do
        expect { updated_kind }.not_to raise_error
      end

      it 'does not update the kind' do
        expect { updated_kind }.not_to(change { kind.reload.attributes })
      end

      it 'rolls back the link changes' do
        updated_kind
        expect(linked_slugs).to contain_exactly('category_1')
      end

      it 'adds validation errors to the kind' do
        expect(updated_kind.errors[:name]).to include("can't be blank")
      end
    end
  end
end
