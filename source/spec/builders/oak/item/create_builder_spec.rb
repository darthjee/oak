# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Item::CreateBuilder do
  describe '.build' do
    subject(:item) { described_class.build(**params) }

    let(:params) do
      {
        scope:,
        name:,
        description:,
        category:,
        kind:,
        user: user_param,
        links: links_data
      }.compact
    end

    let(:scope) { nil }
    let(:user_param) { user }
    let(:name) { 'Sample Item' }
    let(:description) { 'Sample Description' }
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
      let(:scope) { user.items }
      let(:user_param) { nil }

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

    context 'when there are links data' do
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

    context 'when item is invalid' do
      let(:name) { nil }

      it 'returns an instance of Oak::Item' do
        expect(item).to be_an_instance_of(Oak::Item)
      end

      it 'does not raise any errors' do
        expect { item }.not_to raise_error
      end

      it do
        expect(item).not_to be_valid
      end

      it 'adds validation errors to the item' do
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

      it 'returns an instance of Oak::Item' do
        expect(item).to be_an_instance_of(Oak::Item)
      end

      it 'does not raise any errors' do
        expect { item }.not_to raise_error
      end

      it 'marks the item as invalid' do
        expect(item).not_to be_valid
      end

      it 'adds validation errors to the item' do
        expect(item.errors[:links]).to include('is invalid')
      end

      it 'marks the invalid link as invalid' do
        invalid_link = item.links.find { |link| link.url.nil? }
        expect(invalid_link).not_to be_valid
      end

      it 'adds validation errors to the invalid link' do
        invalid_link = item.links.find { |link| link.url.nil? }
        expect(invalid_link.errors[:url]).to include("can't be blank")
      end
    end
  end
end
