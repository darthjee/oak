# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Item::FormDecorator do
  subject(:decorator) { described_class.new(item.tap(&:validate)) }

  let(:item) { build(:oak_item, name:, description:) }
  let(:name) { 'Sample Item' }
  let(:description) { 'Sample Description' }
  let(:category_slug) { item.category.slug }
  let(:kind_slug) { item.kind.slug }
  let(:user) { item.user }

  describe '#as_json' do
    let(:expected) do
      {
        id: item.id,
        name:,
        description:,
        category_slug:,
        kind_slug:,
        links: []
      }.stringify_keys
    end

    context 'when the item has no photos' do
      it 'includes the id and name' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when the item has links' do
      let!(:first_link) { create(:oak_link, item:, order: 2, url: 'https://example.com/2') }
      let!(:second_link) { create(:oak_link, item:, order: 1, url: 'https://example.com/1') }
      let(:expected) do
        {
          id: item.id,
          name:,
          description:,
          category_slug:,
          kind_slug:,
          links: [
            Oak::Link::Decorator.new(second_link).as_json,
            Oak::Link::Decorator.new(first_link).as_json
          ]
        }.deep_stringify_keys
      end

      it 'includes the links' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when the item is invalid' do
      let(:name) { '' }
      let(:errors) { { name: ["can't be blank"] } }
      let(:expected) do
        {
          id: item.id,
          name:,
          description:,
          category_slug:,
          kind_slug:,
          errors:,
          links: []
        }.deep_stringify_keys
      end

      it 'includes the id and name' do
        expect(decorator.as_json).to eq(expected)
      end
    end
  end
end
