# frozen_string_literal: true

FactoryBot.define do
  factory :oak_category_kind, class: 'Oak::CategoryKind' do
    association :category, factory: :oak_category
    association :kind, factory: :oak_kind
  end
end