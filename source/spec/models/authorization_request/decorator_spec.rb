# frozen_string_literal: true

require 'spec_helper'

describe AuthorizationRequest::Decorator do
  subject(:decorator) { described_class.new(authorization_request) }

  let(:authorization_request) { create(:authorization_request) }

  describe '#as_json' do
    let(:expected) do
      {
        'uuid' => authorization_request.uuid,
        'pollToken' => authorization_request.poll_token,
        'expiresAt' => authorization_request.expires_at.utc.iso8601(3)
      }
    end

    it 'exposes uuid, pollToken and expiresAt' do
      expect(decorator.as_json).to eq(expected)
    end

    it 'formats expiresAt as ISO 8601 UTC' do
      expect(decorator.as_json['expiresAt'])
        .to match(/\A\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\z/)
    end
  end
end
