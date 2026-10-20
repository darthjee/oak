# frozen_string_literal: true

class AuthorizationRequest < ApplicationRecord
  STATUSES = %w[open approved logged denied expired].freeze
  EXPIRABLE_STATUSES = %w[open approved].freeze
  USER_AGENT_LIMIT = 512

  attr_reader :poll_token

  belongs_to :user, optional: true

  scope :not_expired, -> { where('expires_at > ?', Time.zone.now) }
  scope :open_for, ->(user) { where(user:, status: 'open').not_expired.order(:created_at, :id) }
  scope :created_by_ip_since, ->(ip, time) { where(request_ip: ip).where('created_at > ?', time) }

  validates :uuid, :login, :poll_token_digest, :expires_at, presence: true
  validates :status, inclusion: { in: STATUSES }

  before_validation :start_defaults, on: :create
  after_create :expire_excess_open

  def self.generate_poll_token
    SecureRandom.urlsafe_base64(32)
  end

  def self.digest(token)
    Digest::SHA256.hexdigest(token.to_s)
  end

  def self.expire_oldest_open_for(user, keep: Settings.authorization_request_max_open)
    return unless user

    excess = open_for(user).count - keep
    return unless excess.positive?

    transition_all(where(id: open_for(user).limit(excess).pluck(:id)), to: 'expired')
  end

  def self.transition_all(scope, to:)
    scope.update_all(status: to, updated_at: Time.zone.now) # rubocop:disable Rails/SkipsModelValidations
  end

  def poll_token=(token)
    @poll_token = token
    self.poll_token_digest = self.class.digest(token)
  end

  def poll_token?(token)
    return false if token.blank? || poll_token_digest.blank?

    ActiveSupport::SecurityUtils.secure_compare(self.class.digest(token), poll_token_digest)
  end

  def expired?
    return true if status == 'expired'

    EXPIRABLE_STATUSES.include?(status) && expires_at <= Time.zone.now
  end

  def current_status
    expired? ? 'expired' : status
  end

  # Atomic approved -> logged transition; true only for the single winner.
  def claim! # rubocop:disable Naming/PredicateMethod
    claimable = self.class.where(id:, status: 'approved').not_expired
    self.class.transition_all(claimable, to: 'logged') == 1
  end

  private

  def start_defaults
    self.uuid ||= SecureRandom.uuid
    self.expires_at ||= Settings.authorization_request_period.from_now
    self.poll_token = self.class.generate_poll_token if poll_token_digest.blank?
    self.request_user_agent = request_user_agent&.first(USER_AGENT_LIMIT)
  end

  def expire_excess_open
    self.class.expire_oldest_open_for(user)
  end
end
