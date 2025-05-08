# frozen_string_literal: true

FactoryBot.define do
  factory :oak_item, class: 'Oak::Item' do
    name { 'Sample Item' }
    association :user, factory: :oak_user
    association :category, factory: :oak_category
    association :kind, factory: :oak_kind
  end
end
