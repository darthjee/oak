# frozen_string_literal: true

class AuthorizationRequest < ApplicationRecord
  class ListDecorator < Azeroth::Decorator
    expose :uuid
    expose :request_ip, as: :requestIp
    expose :request_user_agent, as: :requestUserAgent
    expose :creation, as: :createdAt
    expose :expiration, as: :expiresAt
    expose :keep_signed_in, as: :keepSignedIn

    def creation
      object.created_at.utc.iso8601(3)
    end

    def expiration
      object.expires_at.utc.iso8601(3)
    end
  end
end
