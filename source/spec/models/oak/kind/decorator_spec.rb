# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Kind::Decorator do
  subject(:decorator) { described_class.new(kind) }

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
      let(:expected) do
        {
          name:,
          slug:
        }.stringify_keys
      end
      
      it 'includes the errors' do
        expect(decorator.as_json).to eq(expected)
      end
    end
  end
end
