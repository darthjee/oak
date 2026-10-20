# frozen_string_literal: true

require 'spec_helper'

describe User do
  describe '.login' do
    let!(:user)    { create(:user, password:) }
    let(:password) { 'my_custom_password' }
    let(:login)    { user.login }

    let(:login_hash) do
      {
        login:,
        password:
      }
    end

    context 'when login and password matches' do
      it 'returns user' do
        expect(described_class.login(**login_hash)).to eq(user)
      end
    end

    context 'when login matches but not the password' do
      let(:user) { create(:user) }

      it do
        expect { described_class.login(**login_hash) }
          .to raise_error(Oak::Exception::LoginFailed)
      end
    end

    context 'when login does not matches' do
      let(:login) { 'other_login' }

      it do
        expect { described_class.login(**login_hash) }
          .to raise_error(Oak::Exception::LoginFailed)
      end
    end
  end

  describe '#password=' do
    let(:user)     { build(:user) }
    let(:password) { 'my password' }

    it do
      expect { user.password = password }
        .to change(user, :salt)
    end

    it do
      expect { user.password = password }
        .to change(user, :encrypted_password)
    end

    it 'changes encrypted password to an encrypted value' do
      user.password = password
      expect(user.encrypted_password).not_to eq(password)
    end
  end

  describe '#verify_password!' do
    let(:user)     { create(:user, password:) }
    let(:password) { 'my_custom_password' }

    context 'when password is correct' do
      it 'returns self' do
        expect(user.verify_password!(password)).to eq(user)
      end

      it do
        expect { user.verify_password!(password) }
          .not_to change(user, :salt)
      end
    end

    context 'when password is incorrect' do
      let(:user) { create(:user) }

      it do
        expect { user.verify_password!(password) }
          .to not_change(user, :salt)
          .and raise_error(Oak::Exception::LoginFailed)
      end
    end
  end

  describe '#authorization_locked?' do
    let!(:user) { create(:user, authorization_locked_until: locked_until) }

    context 'when the user was never locked' do
      let(:locked_until) { nil }

      it { expect(user).not_to be_authorization_locked }
    end

    context 'when the lock is in the future' do
      let(:locked_until) { 1.minute.from_now }

      it { expect(user).to be_authorization_locked }
    end

    context 'when the lock has passed' do
      let(:locked_until) { 1.minute.ago }

      it { expect(user).not_to be_authorization_locked }
    end

    context 'when time travels past the lock' do
      let(:locked_until) { 1.minute.from_now }

      it do
        travel_to(2.minutes.from_now) do
          expect(user).not_to be_authorization_locked
        end
      end
    end
  end

  describe '#register_authorization_failure!' do
    let(:user)         { create(:user, authorization_failed_attempts: attempts) }
    let(:max_attempts) { 3 }
    let(:lock_period)  { 10.minutes }

    before do
      freeze_time
      allow(Settings).to receive_messages(
        authorization_request_max_attempts: max_attempts,
        authorization_request_lock_period: lock_period
      )
    end

    context 'when the failure stays below the threshold' do
      let(:attempts) { max_attempts - 2 }

      it 'returns false' do
        expect(user.register_authorization_failure!).to be(false)
      end

      it 'increments the counter' do
        expect { user.register_authorization_failure! }
          .to change { user.reload.authorization_failed_attempts }
          .by(1)
      end

      it 'updates the in-memory counter' do
        expect { user.register_authorization_failure! }
          .to change(user, :authorization_failed_attempts)
          .by(1)
      end

      it 'does not lock the user' do
        expect { user.register_authorization_failure! }
          .not_to(change { user.reload.authorization_locked_until })
      end
    end

    context 'when the failure reaches the threshold' do
      let(:attempts) { max_attempts - 1 }

      it 'returns true' do
        expect(user.register_authorization_failure!).to be(true)
      end

      it 'resets the counter' do
        expect { user.register_authorization_failure! }
          .to change { user.reload.authorization_failed_attempts }
          .to(0)
      end

      it 'locks the user for the lock period' do
        expect { user.register_authorization_failure! }
          .to change { user.reload.authorization_locked_until }
          .to(lock_period.from_now)
      end

      it 'makes the user locked' do
        expect { user.register_authorization_failure! }
          .to change { user.reload.authorization_locked? }
          .from(false).to(true)
      end
    end
  end

  describe '#reset_authorization_failures!' do
    let(:user) { create(:user, authorization_failed_attempts: 3) }

    it 'zeroes the counter' do
      expect { user.reset_authorization_failures! }
        .to change { user.reload.authorization_failed_attempts }
        .from(3).to(0)
    end
  end
end
