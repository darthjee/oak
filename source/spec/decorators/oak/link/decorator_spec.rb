# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Link::Decorator do
  subject(:decorator) { described_class.new(link) }

  let(:link) { build(:oak_link, text:, url:) }
  let(:text) { 'Example Link' }
  let(:url) { 'https://example.com' }

  describe '#as_json' do
    let(:expected) do
      {
        text:,
        url:
      }.stringify_keys
    end

    context 'when the link is valid' do
      it 'includes the text and url' do
        expect(decorator.as_json).to eq(expected)
      end
    end

    context 'when the link is invalid' do
      let(:text) { nil }
      let(:errors) { { text: ["can't be blank"] } }
      let(:expected) do
        {
          text:,
          url:,
          errors:
        }.deep_stringify_keys
      end

      it 'includes the errors' do
        link.validate # Trigger validations
        expect(decorator.as_json).to eq(expected)
      end
    end
  end
end
