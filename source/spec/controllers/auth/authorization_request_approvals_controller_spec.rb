# frozen_string_literal: true

require 'spec_helper'

describe Auth::AuthorizationRequestApprovalsController do
  let(:password)     { 'approver-password' }
  let(:user)         { create(:user, password:) }
  let(:user_session) { create(:session, user:) }
  let(:logged)       { [] }

  shared_examples 'an approver error' do |status|
    it { expect(response).to have_http_status(status) }

    it { expect(response.headers['X-Skip-Cache']).to eq('true') }

    it 'answers with a message' do
      expect(response.parsed_body.keys).to eq(['message'])
    end
  end

  shared_examples 'a request lookup failure' do |action|
    let(:parameters) { { uuid:, password:, format: :json } }

    context 'when the uuid is unknown' do
      let(:uuid) { 'unknown-uuid' }

      before { post action, params: parameters, as: :json }

      it_behaves_like 'an approver error', :bad_request
    end

    context 'when the request belongs to another user' do
      let(:uuid) { create(:authorization_request).uuid }

      before { post action, params: parameters, as: :json }

      it_behaves_like 'an approver error', :bad_request
    end

    context 'when the request has no user' do
      let(:uuid) { create(:authorization_request, :without_user).uuid }

      before { post action, params: parameters, as: :json }

      it_behaves_like 'an approver error', :bad_request
    end

    %i[approved denied logged expired past_expiration].each do |trait|
      context "when the request is #{trait}" do
        let(:authorization_request) { create(:authorization_request, trait, user:) }
        let(:uuid)                  { authorization_request.uuid }

        it 'does not change the status' do
          expect { post action, params: parameters, as: :json }
            .not_to(change { authorization_request.reload.status })
        end

        context 'when the response is rendered' do
          before { post action, params: parameters, as: :json }

          it_behaves_like 'an approver error', :bad_request
        end
      end
    end
  end

  shared_examples 'a logged-in endpoint' do |action|
    context 'when logged out' do
      let(:uuid) { create(:authorization_request, user:).uuid }

      before { post action, params: { uuid:, password:, format: :json }, as: :json }

      it_behaves_like 'an approver error', :unauthorized
    end

    context 'when the session is expired' do
      let(:user_session) { create(:session, :expired, user:) }
      let(:uuid)         { create(:authorization_request, user:).uuid }

      before do
        controller.send(:cookies).signed[:session] = user_session.id
        post action, params: { uuid:, password:, format: :json }, as: :json
      end

      it_behaves_like 'an approver error', :unauthorized
    end
  end

  describe 'POST mine' do
    let(:parameters) { { format: :json } }

    it_behaves_like 'a logged-in endpoint', :mine

    context 'when logged in' do
      before { controller.send(:cookies).signed[:session] = user_session.id }

      context 'when there are no requests' do
        before { post :mine, params: parameters, as: :json }

        it { expect(response).to be_successful }

        it { expect(response.headers['X-Skip-Cache']).to eq('true') }

        it { expect(response.parsed_body).to eq('requests' => []) }
      end

      context 'when there are requests' do
        let!(:older) { create(:authorization_request, user:, created_at: 2.minutes.ago) }
        let!(:newer) { create(:authorization_request, user:, created_at: 1.minute.ago) }

        before do
          create(:authorization_request, :approved, user:)
          create(:authorization_request, :past_expiration, user:)
          create(:authorization_request)
          create(:authorization_request, :without_user)
          post :mine, params: parameters, as: :json
        end

        it { expect(response).to be_successful }

        it { expect(response.headers['X-Skip-Cache']).to eq('true') }

        it 'returns only the open, unexpired requests of the user, newest first' do
          expect(response.parsed_body['requests'].pluck('uuid')).to eq([newer.uuid, older.uuid])
        end

        it 'exposes only the listing fields' do
          expect(response.parsed_body['requests'].first.keys).to contain_exactly(
            'uuid', 'requestIp', 'requestUserAgent', 'createdAt', 'expiresAt', 'keepSignedIn'
          )
        end

        it 'serializes with the list decorator' do
          expect(response.parsed_body['requests'])
            .to eq(JSON.parse(AuthorizationRequest::ListDecorator.new([newer, older]).to_json))
        end
      end
    end
  end

  describe 'POST authorize' do
    let(:authorization_request) { create(:authorization_request, user:) }
    let(:uuid)                  { authorization_request.uuid }
    let(:given_password)        { password }
    let(:parameters)            { { uuid:, password: given_password, format: :json } }
    let(:max_attempts)          { Settings.authorization_request_max_attempts }

    it_behaves_like 'a logged-in endpoint', :authorize

    context 'when logged in' do
      before { controller.send(:cookies).signed[:session] = user_session.id }

      it_behaves_like 'a request lookup failure', :authorize

      context 'with the correct password' do
        before { user.update!(authorization_failed_attempts: 2) }

        it 'approves the request' do
          expect { post :authorize, params: parameters, as: :json }
            .to change { authorization_request.reload.status }.from('open').to('approved')
        end

        it 'resets the failed attempts counter' do
          expect { post :authorize, params: parameters, as: :json }
            .to change { user.reload.authorization_failed_attempts }.from(2).to(0)
        end

        context 'when the response is rendered' do
          before { post :authorize, params: parameters, as: :json }

          it { expect(response).to be_successful }

          it { expect(response.headers['X-Skip-Cache']).to eq('true') }

          it { expect(response.parsed_body).to eq('authorized' => true) }
        end
      end

      context 'when the request stops being open before the write' do
        before do
          allow(AuthorizationRequest).to receive(:find_by).and_wrap_original do |method, *args|
            method.call(*args).tap { |found| AuthorizationRequest.new(id: found.id).deny! }
          end
          post :authorize, params: parameters, as: :json
        end

        it_behaves_like 'an approver error', :bad_request

        it 'keeps the concurrent transition' do
          expect(authorization_request.reload.status).to eq('denied')
        end
      end

      context 'with a wrong password' do
        let(:given_password) { 'wrong-password' }

        it 'increments the failed attempts counter' do
          expect { post :authorize, params: parameters, as: :json }
            .to change { user.reload.authorization_failed_attempts }.by(1)
        end

        it 'does not approve the request' do
          expect { post :authorize, params: parameters, as: :json }
            .not_to(change { authorization_request.reload.status })
        end

        context 'when the response is rendered' do
          before { post :authorize, params: parameters, as: :json }

          it_behaves_like 'an approver error', :bad_request
        end
      end

      context 'without a password' do
        let(:parameters) { { uuid:, format: :json } }

        it 'counts as a failed attempt' do
          expect { post :authorize, params: parameters, as: :json }
            .to change { user.reload.authorization_failed_attempts }.by(1)
        end

        context 'when the response is rendered' do
          before { post :authorize, params: parameters, as: :json }

          it_behaves_like 'an approver error', :bad_request
        end
      end

      context 'with a non-string password' do
        let(:given_password) { { value: password } }

        before { post :authorize, params: parameters, as: :json }

        it_behaves_like 'an approver error', :bad_request
      end

      context 'when the wrong password reaches the max attempts' do
        let(:given_password) { 'wrong-password' }

        before do
          freeze_time
          user.update!(authorization_failed_attempts: max_attempts - 1)
        end

        it 'locks the user for the lock period' do
          expect { post :authorize, params: parameters, as: :json }
            .to change { user.reload.authorization_locked_until }
            .to(Settings.authorization_request_lock_period.from_now)
        end

        it 'resets the counter' do
          expect { post :authorize, params: parameters, as: :json }
            .to change { user.reload.authorization_failed_attempts }.to(0)
        end
      end

      context 'when max wrong passwords are sent in a row' do
        let(:given_password) { 'wrong-password' }

        before do
          max_attempts.times { post :authorize, params: parameters, as: :json }
        end

        it 'locks the user' do
          expect(user.reload).to be_authorization_locked
        end
      end

      context 'when the user is locked' do
        before { user.update!(authorization_locked_until: 1.minute.from_now, authorization_failed_attempts: 1) }

        it 'does not approve even with the correct password' do
          expect { post :authorize, params: parameters, as: :json }
            .not_to(change { authorization_request.reload.status })
        end

        it 'does not change the counter' do
          expect { post :authorize, params: parameters, as: :json }
            .not_to(change { user.reload.authorization_failed_attempts })
        end

        it 'does not check the password' do
          expect_any_instance_of(User).not_to receive(:verify_password!) # rubocop:disable RSpec/AnyInstance
          post :authorize, params: parameters, as: :json
        end

        context 'when the response is rendered' do
          before { post :authorize, params: parameters, as: :json }

          it_behaves_like 'an approver error', :bad_request
        end

        context 'when the lock has passed' do
          it 'approves with the correct password' do
            travel 2.minutes
            expect { post :authorize, params: parameters, as: :json }
              .to change { authorization_request.reload.status }.from('open').to('approved')
          end
        end
      end

      context 'when logging' do
        before do
          allow(Rails.logger).to receive(:info) { |message| logged << message }
        end

        it 'logs the approval with ip and user id' do
          post :authorize, params: parameters, as: :json
          expect(logged).to include(a_string_including('approved', "user_id=#{user.id}", 'ip='))
        end

        it 'never logs the password or the poll token' do
          post :authorize, params: parameters, as: :json
          expect(logged.join).not_to include(password, authorization_request.poll_token)
        end

        context 'with a wrong password' do
          let(:given_password) { 'wrong-password' }

          before { user.update!(authorization_failed_attempts: max_attempts - 1) }

          it 'logs the wrong password and the lockout' do
            post :authorize, params: parameters, as: :json
            expect(logged).to include(
              a_string_including('wrong password', "user_id=#{user.id}", 'ip='),
              a_string_including('lockout triggered', "user_id=#{user.id}", 'ip=')
            )
          end

          it 'never logs the given password' do
            post :authorize, params: parameters, as: :json
            expect(logged.join).not_to include(given_password)
          end
        end
      end
    end
  end

  describe 'POST deny' do
    let(:authorization_request) { create(:authorization_request, user:) }
    let(:uuid)                  { authorization_request.uuid }
    let(:parameters)            { { uuid:, format: :json } }

    it_behaves_like 'a logged-in endpoint', :deny

    context 'when logged in' do
      before { controller.send(:cookies).signed[:session] = user_session.id }

      it_behaves_like 'a request lookup failure', :deny

      it 'denies the request' do
        expect { post :deny, params: parameters, as: :json }
          .to change { authorization_request.reload.status }.from('open').to('denied')
      end

      context 'when the response is rendered' do
        before { post :deny, params: parameters, as: :json }

        it { expect(response).to be_successful }

        it { expect(response.headers['X-Skip-Cache']).to eq('true') }

        it { expect(response.parsed_body).to eq('denied' => true) }
      end

      context 'when the user is locked' do
        before { user.update!(authorization_locked_until: 1.minute.from_now) }

        it 'still denies the request' do
          expect { post :deny, params: parameters, as: :json }
            .to change { authorization_request.reload.status }.from('open').to('denied')
        end
      end

      context 'when logging' do
        before do
          allow(Rails.logger).to receive(:info) { |message| logged << message }
          post :deny, params: parameters, as: :json
        end

        it 'logs the denial with ip and user id' do
          expect(logged).to include(a_string_including('denied', "user_id=#{user.id}", 'ip='))
        end

        it 'never logs the poll token' do
          expect(logged.join).not_to include(authorization_request.poll_token)
        end
      end
    end
  end
end
