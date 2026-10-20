# frozen_string_literal: true

require 'spec_helper'

describe Settings do
  subject(:settings) do
    Class.new(described_class).tap do |klass|
      klass.send(:source, :env, Class.new(EnvSettings))
      klass.send(:source, :db,  Class.new(ActiveSettings))
    end
  end

  let(:env_hash) { {} }

  before do
    env_hash.each do |key, value|
      ENV[key.to_s.upcase] = value&.to_s
    end
  end

  after do
    env_hash.each_key do |key|
      ENV.delete(key.to_s.upcase)
    end
  end

  describe '.password_salt' do
    context 'when nothing is set' do
      it_behaves_like 'a setting', :password_salt do
        let(:expected_default_class) { NilClass }
      end
    end

    context 'when a value is set' do
      it_behaves_like 'a setting', :password_salt do
        let(:value)                  { SecureRandom.hex(10) }
        let(:expected_default_class) { NilClass }
        let(:expected_class)         { String }
      end
    end
  end

  describe '.hex_code_size' do
    it_behaves_like 'a setting', :hex_code_size do
      let(:default_value)  { 16 }
      let(:value)          { Random.rand(10..15) }
      let(:expected_class) { Integer }
    end
  end

  describe '.session_period' do
    it_behaves_like 'a setting', :session_period do
      let(:default_value)  { 2.days }
      let(:value)          { Random.rand(3600..7200) }
      let(:expected_class) { ActiveSupport::Duration }
    end
  end

  describe '.long_session_period' do
    it_behaves_like 'a setting', :long_session_period do
      let(:default_value)  { 30.days }
      let(:value)          { Random.rand(3600..7200) }
      let(:expected_class) { ActiveSupport::Duration }
    end
  end

  describe '.authorization_request_period' do
    it_behaves_like 'a setting', :authorization_request_period do
      let(:default_value)  { 1.hour }
      let(:value)          { Random.rand(3600..7200) }
      let(:expected_class) { ActiveSupport::Duration }
    end
  end

  describe '.authorization_request_create_limit' do
    it_behaves_like 'a setting', :authorization_request_create_limit do
      let(:default_value)  { 5 }
      let(:value)          { Random.rand(6..15) }
      let(:expected_class) { Integer }
    end
  end

  describe '.authorization_request_create_window' do
    it_behaves_like 'a setting', :authorization_request_create_window do
      let(:default_value)  { 1.minute }
      let(:value)          { Random.rand(120..600) }
      let(:expected_class) { ActiveSupport::Duration }
    end
  end

  describe '.authorization_request_max_open' do
    it_behaves_like 'a setting', :authorization_request_max_open do
      let(:default_value)  { 5 }
      let(:value)          { Random.rand(6..15) }
      let(:expected_class) { Integer }
    end
  end

  describe '.authorization_request_max_attempts' do
    it_behaves_like 'a setting', :authorization_request_max_attempts do
      let(:default_value)  { 5 }
      let(:value)          { Random.rand(6..15) }
      let(:expected_class) { Integer }
    end
  end

  describe '.authorization_request_lock_period' do
    it_behaves_like 'a setting', :authorization_request_lock_period do
      let(:default_value)  { 5.minutes }
      let(:value)          { Random.rand(600..1200) }
      let(:expected_class) { ActiveSupport::Duration }
    end
  end
end
