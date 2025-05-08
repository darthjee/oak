# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Subscription, type: :model do
  subject(:subscription) { build(:oak_subscription, user:, category:) }

  let(:user) { build(:user) }
  let(:category) { build(:oak_category) }

  describe 'validations' do
    context 'with valid attributes' do
      it 'is valid' do
        expect(subscription).to be_valid
      end
    end

    context 'when user is missing' do
      let(:user) { nil }

      it 'is not valid without a user' do
        expect(subscription).not_to be_valid
      end

      it 'adds an error on user' do
        subscription.valid? # Trigger validations
        expect(subscription.errors[:user]).to include("can't be blank")
      end
    end

    context 'when category is missing' do
      let(:category) { nil }

      it 'is not valid without a category' do
        expect(subscription).not_to be_valid
      end

      it 'adds an error on category' do
        subscription.valid? # Trigger validations
        expect(subscription.errors[:category]).to include("can't be blank")
      end
    end

    context 'when the combination of user and category is not unique' do
      before { create(:oak_subscription, user:, category:) }

      it 'is not valid' do
        expect(subscription).not_to be_valid
      end

      it 'adds an error on category' do
        subscription.valid? # Trigger validations
        expect(subscription.errors[:category]).to include('has already been subscribed by this user')
      end
    end
  end
end
