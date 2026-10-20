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

  describe 'POST poll' do
    let(:poll_token)       { SecureRandom.urlsafe_base64(32) }
    let(:status)           { 'open' }
    let(:keep_signed_in)   { false }
    let(:request_token)    { poll_token }
    let(:uuid)             { authorization_request.uuid }
    let(:parameters)       { { uuid:, pollToken: request_token, format: :json } }
    let(:created_session)  { user.sessions.last }
    let(:session_cookie) do
      Array(response.headers['Set-Cookie'])
        .flat_map { |header| header.split("\n") }
        .find { |header| header.start_with?('session=') }
    end

    let(:authorization_request) do
      create(:authorization_request, user:, poll_token:, status:, keep_signed_in:)
    end

    shared_examples 'a poll answering' do |expected_status|
      before { post :poll, params: parameters, as: :json }

      it { expect(response).to be_successful }

      it { expect(response.headers['X-Skip-Cache']).to eq('true') }

      it { expect(response.parsed_body).to eq('status' => expected_status) }

      it 'does not set the session cookie' do
        expect(session_cookie).to be_nil
      end
    end

    shared_examples 'a poll not found' do
      before { post :poll, params: parameters, as: :json }

      it { expect(response).to have_http_status(:not_found) }

      it { expect(response.headers['X-Skip-Cache']).to eq('true') }

      it do
        expect(response.parsed_body).to eq('message' => 'Authorization request not found')
      end
    end

    context 'when the uuid is unknown' do
      let(:uuid) { SecureRandom.uuid }

      it_behaves_like 'a poll not found'
    end

    context 'when the token is missing' do
      let(:parameters) { { uuid:, format: :json } }

      it_behaves_like 'a poll not found'
    end

    context 'when the token is wrong' do
      let(:request_token) { SecureRandom.urlsafe_base64(32) }

      it_behaves_like 'a poll not found'
    end

    context 'when the token is wrong and the request is approved' do
      let(:status)        { 'approved' }
      let(:request_token) { SecureRandom.urlsafe_base64(32) }

      it 'does not claim the request' do
        post :poll, params: parameters, as: :json
        expect(authorization_request.reload.status).to eq('approved')
      end
    end

    context 'when the request is open' do
      it_behaves_like 'a poll answering', 'open'
    end

    context 'when the request is denied' do
      let(:status) { 'denied' }

      it_behaves_like 'a poll answering', 'denied'
    end

    context 'when the request is expired' do
      let(:status) { 'expired' }

      it_behaves_like 'a poll answering', 'expired'
    end

    context 'when the request is logged' do
      let(:status) { 'logged' }

      it_behaves_like 'a poll answering', 'logged'
    end

    context 'when the request is open but past expiration' do
      before { authorization_request.update!(expires_at: 1.minute.ago) }

      it_behaves_like 'a poll answering', 'expired'
    end

    context 'when the request is approved but past expiration' do
      let(:status) { 'approved' }

      before { authorization_request.update!(expires_at: 1.minute.ago) }

      it_behaves_like 'a poll answering', 'expired'

      it 'does not create a session' do
        expect { post :poll, params: parameters, as: :json }
          .not_to change(Session, :count)
      end
    end

    context 'when the request is approved' do
      let(:status) { 'approved' }

      it 'creates a session' do
        expect { post :poll, params: parameters, as: :json }
          .to change(user.sessions, :count).by(1)
      end

      it 'claims the request' do
        expect { post :poll, params: parameters, as: :json }
          .to change { authorization_request.reload.status }.from('approved').to('logged')
      end

      context 'when the poll wins the claim' do
        before { post :poll, params: parameters, as: :json }

        it { expect(response).to be_successful }

        it { expect(response.headers['X-Skip-Cache']).to eq('true') }

        it 'answers approved with the session' do
          expect(response.parsed_body).to eq(
            'status' => 'approved',
            'session' => JSON.parse(Session::Decorator.new(created_session).to_json)
          )
        end

        it 'stores the session in the signed cookie' do
          expect(cookies.signed[:session]).to eq(created_session.id)
        end

        it 'creates a session with the regular expiration' do
          expect(created_session.expiration)
            .to be_in(Time.zone.now..Settings.session_period.from_now)
        end

        it 'sets a session-only cookie' do
          expect(session_cookie).to match(/\Asession=(?!.*expires=)/i)
        end
      end

      context 'when keep_signed_in is true' do
        let(:keep_signed_in) { true }

        before { post :poll, params: parameters, as: :json }

        it 'creates a session with the long expiration' do
          expect(created_session.expiration)
            .to be_in(Settings.session_period.from_now..Settings.long_session_period.from_now)
        end

        it 'sets a persistent cookie' do
          expect(session_cookie).to match(/expires=/i)
        end
      end

      context 'when the claim was already won by another poll' do
        before { authorization_request.claim! }

        it_behaves_like 'a poll answering', 'logged'

        it 'does not create a session' do
          expect { post :poll, params: parameters, as: :json }
            .not_to change(Session, :count)
        end
      end

      context 'when another poll claims it concurrently' do
        # The record is loaded as approved, then another poll wins before this claim runs.
        before do
          allow(AuthorizationRequest).to receive(:find_by).and_wrap_original do |method, *args|
            method.call(*args).tap { |found| AuthorizationRequest.new(id: found.id).claim! }
          end
        end

        it_behaves_like 'a poll answering', 'logged'
      end

      context 'when logging' do
        let(:logged) { [] }

        before do
          allow(Rails.logger).to receive(:info) { |message| logged << message }
          post :poll, params: parameters, as: :json
        end

        it 'logs the minted session with ip and user id' do
          expect(logged)
            .to include(a_string_including('session minted', "user_id=#{user.id}", 'ip='))
        end

        it 'never logs the poll token' do
          expect(logged.join).not_to include(poll_token)
        end
      end
    end
  end
end
