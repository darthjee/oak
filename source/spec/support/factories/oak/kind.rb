# frozen_string_literal: true

FactoryBot.define do
  factory :oak_kind, class: 'Oak::Kind' do
    name { SecureRandom.hex(20) }
  end
end
