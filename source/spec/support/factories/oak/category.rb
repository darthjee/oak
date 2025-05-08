# frozen_string_literal: true

FactoryBot.define do
  factory :oak_category, class: 'Oak::Category' do
    name { SecureRandom.hex(10) }
    slug { SecureRandom.hex(10) }
  end
end
