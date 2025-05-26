# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Subscription::Decorator do
  subject(:decorator) { described_class.new(subscription.tap(&:validate)) }

  let(:subscription) { build(:oak_subscription, user:, category:) }
  let(:user) { create(:user) }
  let(:category) { create(:oak_category, name: 'Sample Category') }

  describe '#as_json' do
    let(:expected) do
      {
        id: subscription.id,
        user_id: user.id,
        category_slug: category.slug
      }.stringify_keys
    end

    it 'includes the id, user_id, and category_slug' do
      expect(decorator.as_json).to eq(expected)
    end

    context 'when the subscription is invalid' do
      let(:category) { nil }
      let(:expected) do
        {
          id: subscription.id,
          user_id: user.id,
          category_slug: nil,
          errors: { category: ['must exist', "can't be blank"] }
        }.deep_stringify_keys
      end

      it 'includes the errors' do
        expect(decorator.as_json).to eq(expected)
      end
    end
  end
end
