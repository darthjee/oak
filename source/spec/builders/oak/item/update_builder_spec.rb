# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Item::UpdateBuilder do
  describe '.build' do
    subject(:updated_item) { described_class.build(**params) }

    let(:params) do
      {
        item: item,
        name: name,
        description: description,
        category: category,
        kind: kind,
        user: user,
        links: links_data
      }.compact
    end

    let(:item) { create(:oak_item, name: 'Old Name', description: 'Old Description', category:, kind:, user:) }
    let(:name) { 'Updated Name' }
    let(:description) { 'Updated Description' }
    let(:category) { create(:oak_category) }
    let(:kind) { create(:oak_kind) }
    let(:user) { create(:user) }
    let(:links_data) { [] }
    let(:new_attributes) do
      {
        id: item.id,
        name: 'Updated Name',
        description: 'Updated Description',
        category_id: category.id,
        kind_id: kind.id,
        user_id: user.id,
        order: 0
      }.stringify_keys
    end

    context 'when the update is valid' do
      it 'updates the item attributes' do
        expect { updated_item }
          .to change { item.reload.attributes.except('created_at', 'updated_at') }
          .to(new_attributes)
      end
    end

    context 'when there are links data' do
      let(:links_data) do
        [
          { url: 'https://example.com/1', text: 'Example Link 1', order: 1 },
          { url: 'https://example.com/2', text: 'Example Link 2', order: 2 }
        ]
      end

      it 'creates new links for the item' do
        expect { updated_item }
          .to change { item.links.count }.by(2)
      end
    end

    context 'when links are updated' do
      let!(:existing_link) { create(:oak_link, item:, url: 'https://example.com/old', text: 'Old Link', order: 1) }
      let(:links_data) do
        [
          { id: existing_link.id, url: 'https://example.com/updated', text: 'Updated Link', order: 1 }
        ]
      end
      let(:expected_attributes) do
        {
          id: existing_link.id,
          url: 'https://example.com/updated',
          text: 'Updated Link',
          order: 1,
          item_id: item.id
        }.stringify_keys
      end

      it 'updates the existing links' do
        expect { updated_item }
          .to not_change { item.links.count }
          .and change { existing_link.reload.attributes.except('created_at', 'updated_at') }
          .to(expected_attributes)
      end
    end

    context 'when links are deleted' do
      let(:links_data) { [] }

      before do
        create(
          :oak_link, item:, url: 'https://example.com/old',
                     text: 'Old Link', order: 1
        )
      end

      it 'removes the existing links' do
        expect { updated_item }
          .to change { item.links.count }.by(-1)
      end
    end

    context 'when the update is invalid' do
      let(:name) { nil }
      let!(:existing_link) { create(:oak_link, item:, url: 'https://example.com/old', text: 'Old Link', order: 1) }
      let(:links_data) do
        [
          { id: existing_link.id, url: 'https://example.com/updated', text: 'Updated Link', order: 1 }
        ]
      end

      it 'does not update the item' do
        expect { updated_item }
          .not_to(change { item.reload.attributes })
      end

      it 'does not update the existing links' do
        expect { updated_item }
          .not_to(change { existing_link.reload.attributes })
      end

      it 'adds validation errors to the item' do
        updated_item
        expect(item.errors[:name]).to include("can't be blank")
      end
    end

    context 'when one of the links is invalid' do
      let(:links_data) do
        [
          { url: 'https://example.com/1', text: 'Example Link 1', order: 1 },
          { url: nil, text: 'Invalid Link', order: 2 }
        ]
      end

      it 'does not update the item' do
        expect { updated_item }
          .not_to(change { item.reload.attributes })
      end

      it 'adds validation errors to the item' do
        updated_item
        expect(item.errors[:links]).to include('is invalid')
      end

      it 'marks the invalid link as invalid' do
        updated_item
        invalid_link = item.links.find { |link| link.url.nil? }
        expect(invalid_link).not_to be_valid
      end

      it 'adds validation errors to the invalid link' do
        updated_item
        invalid_link = item.links.find { |link| link.url.nil? }
        expect(invalid_link.errors[:url]).to include("can't be blank")
      end
    end
  end
end
