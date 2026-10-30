# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Category::SelectDecorator do
  subject(:decorator) { described_class.new(category.tap(&:validate)) }

  let(:category) { build(:oak_category, name:) }
  let(:slug) { category.slug }
  let(:name) { 'Sample Category' }

  describe '#as_json' do
    let(:expected) do
      {
        name:,
        slug:
      }.stringify_keys
    end

    context 'when category is valid' do
      it 'includes the name and slug' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when category is invalid' do
      let(:name) { nil }
      let(:errors) do
        { name: ["can't be blank"], slug: ["can't be blank"] }
      end
      let(:expected) do
        {
          name:,
          slug:,
          errors:
        }.deep_stringify_keys
      end

      it 'includes the errors' do
        expect(decorator.as_json).to eq(expected)
      end
    end
  end
end
