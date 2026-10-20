# frozen_string_literal: true

require 'spec_helper'

describe AuthorizationRequest do
  let(:user) { create(:user) }

  describe 'creation defaults' do
    subject(:request) do
      described_class.create!(user:, login: user.login)
    end

    it 'generates a UUIDv4' do
      expect(request.uuid)
        .to match(/\A\h{8}-\h{4}-4\h{3}-[89ab]\h{3}-\h{12}\z/)
    end

    it 'starts as open' do
      expect(request.status).to eq('open')
    end

    it 'does not keep signed in by default' do
      expect(request.keep_signed_in).to be(false)
    end

    it 'expires after the configured period' do
      expect(request.expires_at)
        .to be_within(5.seconds).of(Settings.authorization_request_period.from_now)
    end

    it 'generates a poll token' do
      expect(request.poll_token).to be_present
    end

    it 'stores only the hex digest of the token' do
      expect(request.poll_token_digest)
        .to eq(Digest::SHA256.hexdigest(request.poll_token))
    end

    it 'never persists the raw token' do
      expect(described_class.find(request.id).attributes.values)
        .not_to include(request.poll_token)
    end
  end

  describe 'validations' do
    it 'rejects unknown statuses' do
      expect(build(:authorization_request, status: 'foo')).not_to be_valid
    end

    it 'requires a login' do
      expect(build(:authorization_request, login: nil)).not_to be_valid
    end

    it 'accepts requests without user' do
      expect(build(:authorization_request, :without_user)).to be_valid
    end
  end

  describe 'user agent truncation' do
    let(:request) do
      create(:authorization_request, request_user_agent: 'a' * 600)
    end

    it do
      expect(request.reload.request_user_agent.size).to eq(512)
    end
  end

  describe '.generate_poll_token' do
    it 'generates a long url safe token' do
      expect(described_class.generate_poll_token).to match(/\A[\w-]{43,}\z/)
    end
  end

  describe '#poll_token?' do
    let(:token)   { SecureRandom.urlsafe_base64(32) }
    let(:request) { create(:authorization_request, poll_token: token) }

    it 'accepts the right token' do
      expect(request.poll_token?(token)).to be(true)
    end

    it 'rejects a wrong token' do
      expect(request.poll_token?("#{token}x")).to be(false)
    end

    it 'rejects a blank token' do
      expect(request.poll_token?('')).to be(false)
    end

    it 'rejects a nil token' do
      expect(request.poll_token?(nil)).to be(false)
    end
  end

  describe '#current_status' do
    %w[open approved].each do |status|
      context "when #{status} and not past expiration" do
        let(:request) { create(:authorization_request, status:) }

        it { expect(request.current_status).to eq(status) }
        it { expect(request).not_to be_expired }
      end

      context "when #{status} and past expiration" do
        let(:request) { create(:authorization_request, :past_expiration, status:) }

        it { expect(request.current_status).to eq('expired') }
        it { expect(request).to be_expired }
      end
    end

    %w[logged denied expired].each do |status|
      context "when #{status} and past expiration" do
        let(:request) { create(:authorization_request, :past_expiration, status:) }

        it { expect(request.current_status).to eq(status) }
      end
    end
  end

  describe '#claim!' do
    let(:request) { create(:authorization_request, :approved) }

    context 'when approved' do
      it 'claims it the first time' do
        expect(request.claim!).to be(true)
      end

      it 'moves it to logged' do
        expect { request.claim! }
          .to change { request.reload.status }.from('approved').to('logged')
      end

      it 'does not claim it twice' do
        request.claim!
        expect(request.claim!).to be(false)
      end
    end

    context 'when approved but past expiration' do
      let(:request) { create(:authorization_request, :approved, :past_expiration) }

      it { expect(request.claim!).to be(false) }

      it 'does not change status' do
        expect { request.claim! }.not_to(change { request.reload.status })
      end
    end

    context 'when open' do
      let(:request) { create(:authorization_request) }

      it { expect(request.claim!).to be(false) }
    end
  end

  describe 'open requests cap' do
    let(:max_open) { Settings.authorization_request_max_open }

    let!(:old_requests) do
      Array.new(max_open) do |index|
        create(:authorization_request, user:, created_at: (max_open - index).minutes.ago)
      end
    end

    it 'expires the oldest open request' do
      expect { create(:authorization_request, user:) }
        .to change { old_requests.first.reload.status }.from('open').to('expired')
    end

    it 'keeps the other open requests' do
      create(:authorization_request, user:)
      expect(old_requests[1..].map { |req| req.reload.status }.uniq).to eq(['open'])
    end

    it 'keeps at most max open requests' do
      create(:authorization_request, user:)
      expect(described_class.open_for(user).count).to eq(max_open)
    end

    it 'does not affect other users' do
      expect { create(:authorization_request) }
        .not_to(change { described_class.open_for(user).count })
    end

    context 'when the requests have no user' do
      let(:user) { nil }

      it 'does not expire anything' do
        expect { create(:authorization_request, user: nil) }
          .not_to(change { described_class.where(status: 'expired').count })
      end
    end
  end

  describe '.created_by_ip_since' do
    let!(:recent) { create(:authorization_request, request_ip: '10.0.0.1') }

    before do
      create(:authorization_request, request_ip: '10.0.0.1', created_at: 2.minutes.ago)
      create(:authorization_request, request_ip: '10.0.0.2')
    end

    it do
      expect(described_class.created_by_ip_since('10.0.0.1', 1.minute.ago))
        .to contain_exactly(recent)
    end
  end
end
