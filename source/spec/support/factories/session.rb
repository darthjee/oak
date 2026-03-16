# frozen_string_literal: true

FactoryBot.define do
  factory :session, class: 'Session' do
    user

    trait :expired do
      expiration { 1.day.ago }
    end
  end
end
