# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Item::IndexDecorator do
  subject(:decorator) { described_class.new(item) }

  let(:item) { build(:oak_item, name:) }
  let(:name) { 'Sample Item' }

  describe '#as_json' do
    let(:expected) do
      {
        id: item.id,
        name:
      }.stringify_keys
    end

    it 'includes the id and name' do
      expect(decorator.as_json).to eq(expected)
    end
  end
end