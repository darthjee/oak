# frozen_string_literal: true

class AuthorizationRequest < ApplicationRecord
  class Decorator < Azeroth::Decorator
    expose :uuid
    expose :poll_token, as: :pollToken
    expose :expiration, as: :expiresAt

    def expiration
      object.expires_at.utc.iso8601(3)
    end
  end
end
