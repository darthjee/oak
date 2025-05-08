# frozen_string_literal: true

FactoryBot.define do
  factory :oak_subscription, class: 'Oak::Subscription' do
    association :user, factory: :user
    association :category, factory: :oak_category
  end
end
