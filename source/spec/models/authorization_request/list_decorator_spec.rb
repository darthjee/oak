# frozen_string_literal: true

require 'spec_helper'

describe AuthorizationRequest::ListDecorator do
  subject(:decorator) { described_class.new(authorization_request) }

  let(:authorization_request) do
    create(
      :authorization_request,
      keep_signed_in: true,
      request_ip: '10.0.0.7',
      request_user_agent: 'Agent/1.0'
    )
  end

  let(:iso8601) { /\A\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\z/ }

  describe '#as_json' do
    let(:expected) do
      {
        'uuid' => authorization_request.uuid,
        'requestIp' => '10.0.0.7',
        'requestUserAgent' => 'Agent/1.0',
        'createdAt' => authorization_request.created_at.utc.iso8601(3),
        'expiresAt' => authorization_request.expires_at.utc.iso8601(3),
        'keepSignedIn' => true
      }
    end

    it 'exposes only the listing fields' do
      expect(decorator.as_json).to eq(expected)
    end

    it 'formats createdAt as ISO 8601 UTC' do
      expect(decorator.as_json['createdAt']).to match(iso8601)
    end

    it 'formats expiresAt as ISO 8601 UTC' do
      expect(decorator.as_json['expiresAt']).to match(iso8601)
    end

    it 'does not expose secrets or internal ids' do
      expect(decorator.as_json.keys)
        .not_to include('pollToken', 'poll_token_digest', 'pollTokenDigest',
                        'id', 'user_id', 'userId', 'login', 'status')
    end
  end

  context 'when decorating a collection' do
    subject(:decorator) { described_class.new([authorization_request]) }

    it 'returns a list of decorated requests' do
      expect(decorator.as_json.pluck('uuid'))
        .to eq([authorization_request.uuid])
    end
  end
end
