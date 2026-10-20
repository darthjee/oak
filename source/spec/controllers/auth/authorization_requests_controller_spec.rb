# frozen_string_literal: true

require 'spec_helper'

describe Auth::AuthorizationRequestsController do
  let(:user) { create(:user) }

  describe 'POST create' do
    let(:login)      { user.login }
    let(:parameters) { { login:, format: :json } }
    let(:created)    { AuthorizationRequest.last }

    context 'when the login belongs to a user' do
      before { post :create, params: parameters, as: :json }

      it { expect(response).to be_successful }

      it { expect(response.headers['X-Skip-Cache']).to eq('true') }

      it 'returns uuid, pollToken and expiresAt' do
        expect(response.parsed_body.keys).to contain_exactly('uuid', 'pollToken', 'expiresAt')
      end

      it 'returns the created uuid' do
        expect(response.parsed_body['uuid']).to eq(created.uuid)
      end

      it 'returns the expiration as ISO 8601 UTC' do
        expect(response.parsed_body['expiresAt']).to eq(created.expires_at.utc.iso8601(3))
      end

      it 'links the request to the user' do
        expect(created.user).to eq(user)
      end

      it 'stores the login as typed' do
        expect(created.login).to eq(login)
      end

      it 'does not keep signed in by default' do
        expect(created.keep_signed_in).to be(false)
      end

      it 'stores the digest of the returned token' do
        expect(created.poll_token_digest)
          .to eq(Digest::SHA256.hexdigest(response.parsed_body['pollToken']))
      end

      it 'does not store the raw token' do
        expect(created.attributes.values).not_to include(response.parsed_body['pollToken'])
      end

      it 'stores the request ip' do
        expect(created.request_ip).to eq(request.remote_ip)
      end
    end

    context 'when the login is unknown' do
      let(:login) { 'nobody-here' }

      before { post :create, params: parameters, as: :json }

      it { expect(response).to be_successful }

      it 'returns the same keys as for a known login' do
        expect(response.parsed_body.keys).to contain_exactly('uuid', 'pollToken', 'expiresAt')
      end

      it 'creates a request without user' do
        expect(created.user_id).to be_nil
      end

      it 'stores the login as typed' do
        expect(created.login).to eq(login)
      end
    end

    context 'when keepSignedIn is true' do
      let(:parameters) { { login:, keepSignedIn: true, format: :json } }

      before { post :create, params: parameters, as: :json }

      it { expect(response).to be_successful }

      it { expect(created.keep_signed_in).to be(true) }
    end

    context 'when keepSignedIn is false' do
      let(:parameters) { { login:, keepSignedIn: false, format: :json } }

      before { post :create, params: parameters, as: :json }

      it { expect(created.keep_signed_in).to be(false) }
    end

    context 'when keepSignedIn is not a strict boolean' do
      let(:parameters) { { login:, keepSignedIn: 'true', format: :json } }

      it 'does not create a request' do
        expect { post :create, params: parameters, as: :json }
          .not_to change(AuthorizationRequest, :count)
      end

      context 'when the request is completed' do
        before { post :create, params: parameters, as: :json }

        it { expect(response).to have_http_status(:bad_request) }

        it { expect(response.headers['X-Skip-Cache']).to eq('true') }

        it do
          expect(response.parsed_body).to eq('message' => 'keepSignedIn must be a boolean')
        end
      end
    end

    context 'when the login is blank' do
      let(:login) { '' }

      it 'does not create a request' do
        expect { post :create, params: parameters, as: :json }
          .not_to change(AuthorizationRequest, :count)
      end

      context 'when the request is completed' do
        before { post :create, params: parameters, as: :json }

        it { expect(response).to have_http_status(:bad_request) }

        it { expect(response.headers['X-Skip-Cache']).to eq('true') }

        it { expect(response.parsed_body).to eq('message' => 'login is required') }
      end
    end

    context 'when the login is missing' do
      let(:parameters) { { format: :json } }

      before { post :create, params: parameters, as: :json }

      it { expect(response).to have_http_status(:bad_request) }
    end

    context 'when the ip reached the rate limit' do
      before do
        Settings.authorization_request_create_limit.times do
          create(:authorization_request, :without_user, login: 'unknown', request_ip: '0.0.0.0')
        end
      end

      it 'does not create a request' do
        expect { post :create, params: parameters, as: :json }
          .not_to change(AuthorizationRequest, :count)
      end

      context 'when the request is completed' do
        before { post :create, params: parameters, as: :json }

        it { expect(response).to have_http_status(:too_many_requests) }

        it { expect(response.headers['X-Skip-Cache']).to eq('true') }

        it { expect(response.parsed_body.keys).to eq(['message']) }
      end
    end

    context 'when the previous requests of the ip are outside the window' do
      before do
        Settings.authorization_request_create_limit.times do
          create(:authorization_request, request_ip: '0.0.0.0', created_at: 2.minutes.ago)
        end
      end

      it 'creates a request' do
        expect { post :create, params: parameters, as: :json }
          .to change(AuthorizationRequest, :count).by(1)
      end
    end

    context 'when the user already has the max open requests' do
      let!(:oldest) do
        create(:authorization_request, user:, request_ip: '10.0.0.1', created_at: 10.minutes.ago)
      end

      before do
        (Settings.authorization_request_max_open - 1).times do
          create(:authorization_request, user:, request_ip: '10.0.0.1')
        end
      end

      it 'expires the oldest open request' do
        expect { post :create, params: parameters, as: :json }
          .to change { oldest.reload.status }.from('open').to('expired')
      end
    end

    context 'when logging' do
      let(:logged) { [] }

      before do
        allow(Rails.logger).to receive(:info) { |message| logged << message }
        post :create, params: parameters, as: :json
      end

      it 'logs the creation with ip and user id' do
        expect(logged).to include(a_string_including('created', "user_id=#{user.id}", 'ip='))
      end

      it 'never logs the poll token' do
        expect(logged.join).not_to include(response.parsed_body['pollToken'])
      end
    end
  end
end
