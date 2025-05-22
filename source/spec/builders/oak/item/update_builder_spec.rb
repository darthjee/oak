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

    context 'when the update is valid' do
      it 'updates the item attributes' do
        updated_item
        item.reload

        expect(item.name).to eq('Updated Name')
        expect(item.description).to eq('Updated Description')
        expect(item.category).to eq(category)
        expect(item.kind).to eq(kind)
        expect(item.user).to eq(user)
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

        expect(item.links.map(&:url)).to contain_exactly('https://example.com/1', 'https://example.com/2')
        expect(item.links.map(&:text)).to contain_exactly('Example Link 1', 'Example Link 2')
      end
    end

    context 'when links are updated' do
      let!(:existing_link) { create(:oak_link, item:, url: 'https://example.com/old', text: 'Old Link', order: 1) }
      let(:links_data) do
        [
          { id: existing_link.id, url: 'https://example.com/updated', text: 'Updated Link', order: 1 }
        ]
      end

      it 'updates the existing links' do
        updated_item
        existing_link.reload

        expect(existing_link.url).to eq('https://example.com/updated')
        expect(existing_link.text).to eq('Updated Link')
      end
    end

    context 'when links are deleted' do
      let!(:existing_link) { create(:oak_link, item:, url: 'https://example.com/old', text: 'Old Link', order: 1) }
      let(:links_data) { [] }

      it 'removes the existing links' do
        expect { updated_item }
          .to change { item.links.count }.by(-1)

        expect(item.links).to be_empty
      end
    end

    context 'when the update is invalid' do
      let(:name) { nil }

      it 'does not update the item' do
        expect { updated_item }
          .not_to change { item.reload.attributes }
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
          .not_to change { item.reload.attributes }
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