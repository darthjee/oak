# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Item::CreateBuilder do
  describe '.build' do
    subject(:item) { described_class.build(params) }

    let(:params) do
      {
        name: 'Sample Item',
        description: 'Sample Description',
        category: category,
        kind: kind,
        user: user,
        extra_param: 'should be ignored'
      }
    end

    let(:category) { build(:oak_category) }
    let(:kind) { build(:oak_kind) }
    let(:user) { build(:user) }

    it 'returns an instance of Oak::Item' do
      expect(item).to be_an_instance_of(Oak::Item)
    end

    it 'assigns the correct attributes to the item' do
      expect(item.name).to eq('Sample Item')
      expect(item.description).to eq('Sample Description')
      expect(item.category).to eq(category)
      expect(item.kind).to eq(kind)
      expect(item.user).to eq(user)
    end

    it 'ignores extra parameters' do
      expect { item.extra_param }.to raise_error(NoMethodError)
    end
  end
end