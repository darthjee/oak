# frozen_string_literal: true

FactoryBot.define do
  factory :authorization_request, class: 'AuthorizationRequest' do
    user
    login          { user&.login || 'unknown-login' }
    poll_token     { SecureRandom.urlsafe_base64(32) }
    keep_signed_in { false }
    request_ip     { '127.0.0.1' }
    request_user_agent { 'Mozilla/5.0' }

    trait :approved do
      status { 'approved' }
    end

    trait :denied do
      status { 'denied' }
    end

    trait :logged do
      status { 'logged' }
    end

    trait :expired do
      status { 'expired' }
    end

    trait :past_expiration do
      expires_at { 1.minute.ago }
    end

    trait :without_user do
      user { nil }
    end
  end
end
