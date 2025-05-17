# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Kind::Decorator do
  subject(:decorator) { described_class.new(kind.tap(&:validate)) }

  let(:kind) { build(:oak_kind, name:) }
  let(:slug) { kind.slug }
  let(:name) { 'Sample Kind' }

  describe '#as_json' do
    let(:expected) do
      {
        name:,
        slug:
      }.stringify_keys
    end

    context 'when kind is valid' do
      it 'includes the name' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when kind is invalid' do
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
