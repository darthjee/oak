# frozen_string_literal: true

FactoryBot.define do
  factory :oak_category, class: 'Oak::Category' do
    name { SecureRandom.hex(20) }
  end
end
