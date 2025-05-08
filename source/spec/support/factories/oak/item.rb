# frozen_string_literal: true

FactoryBot.define do
  factory :oak_item, class: 'Oak::Item' do
    name { 'Sample Item' }
    association :user
    association :category
  end
end
