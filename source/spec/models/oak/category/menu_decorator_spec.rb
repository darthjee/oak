# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Category::MenuDecorator do
  subject(:decorator) { described_class.new(category) }

  let(:category) { build(:oak_category, name: 'Sample Category') }
  let(:slug) { category.slug }

  describe '#as_json' do
    let(:expected) do
      {
        name: 'Sample Category',
        slug:
      }.stringify_keys
    end

    it 'includes the name' do
      expect(decorator.as_json).to eq(expected)
    end
  end
end
