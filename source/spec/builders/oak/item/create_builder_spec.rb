# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Item::CreateBuilder do
  describe '.build' do
    subject(:item) { described_class.build(**params) }

    let(:params) do
      {
        name: 'Sample Item',
        description: 'Sample Description',
        category: category,
        kind: kind,
        user: user,
        links: links_data
      }
    end

    let(:category) { build(:oak_category) }
    let(:kind) { build(:oak_kind) }
    let(:user) { build(:user) }
    let(:links_data) { [] }

    context 'when no scope is provided' do
      it 'returns an instance of Oak::Item' do
        expect(item).to be_an_instance_of(Oak::Item)
      end

      it 'creates a valid item from attributes' do
        expect(item).to be_valid
      end

      it 'ignores extra parameters' do
        expect { item.extra_param }.to raise_error(NoMethodError)
      end
    end

    context 'when user is part of the scope' do
      let(:params) do
        {
          scope: user.items,
          name: 'Sample Item',
          description: 'Sample Description',
          category: category,
          kind: kind
        }
      end

      it 'returns an instance of Oak::Item' do
        expect(item).to be_an_instance_of(Oak::Item)
      end

      it 'creates a valid item from attributes' do
        expect(item).to be_valid
      end

      it 'sets the user from the scope' do
        expect(item.user).to eq(user)
      end
    end

    context 'where there are links data' do
      let(:links_data) do
        [
          { url: 'https://example.com/1', text: 'Example Link 1', order: 1 },
          { url: 'https://example.com/2', text: 'Example Link 2', order: 2 }
        ]
      end

      it 'returns an instance of Oak::Item' do
        expect(item).to be_an_instance_of(Oak::Item)
      end

      it 'assigns the links to the item' do
        expect(item.links.size).to eq(2)
      end

      it 'creates links of Oak::Link' do
        expect(item.links).to all(be_an_instance_of(Oak::Link))
      end

      it 'creates a valid links from attributes' do
        expect(item.links).to all(be_valid)
      end
    end
  end
end
