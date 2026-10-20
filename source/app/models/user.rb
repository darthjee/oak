# frozen_string_literal: true

class User < ApplicationRecord
  validates :name, :login, :email, :encrypted_password, presence: true

  has_many :sessions
  has_many :authorization_requests, dependent: :destroy
  has_many :subscriptions, class_name: 'Oak::Subscription', dependent: :destroy
  has_many :categories, through: :subscriptions, source: :category
  has_many :items, class_name: 'Oak::Item', dependent: :destroy

  validates :login,
            presence: true,
            length: { maximum: 50 }
  validates :email,
            presence: true,
            length: { maximum: 100 }
  validates :name,
            presence: true,
            length: { maximum: 100 }

  def self.login(login:, password:)
    User.find_by!(login:).verify_password!(password)
  rescue ActiveRecord::RecordNotFound
    raise Oak::Exception::LoginFailed
  end

  def password=(pass)
    self.salt = SecureRandom.hex
    self.encrypted_password = encrypt_password(pass)
  end

  def verify_password!(pass)
    return self if encrypted_password == encrypt_password(pass)

    raise Oak::Exception::LoginFailed
  end

  def authorization_locked?
    authorization_locked_until.present? && authorization_locked_until > Time.zone.now
  end

  # Counts a wrong approver password; true only when this failure triggers the lock.
  def register_authorization_failure! # rubocop:disable Naming/PredicateMethod
    increment_authorization_failures
    return false if authorization_failed_attempts < Settings.authorization_request_max_attempts

    lock_authorization!
    true
  end

  def reset_authorization_failures!
    write_authorization_lockout(authorization_failed_attempts: 0)
  end

  private

  def increment_authorization_failures
    self.class.update_counters(id, authorization_failed_attempts: 1) # rubocop:disable Rails/SkipsModelValidations
    self.authorization_failed_attempts = self.class.where(id:).pick(:authorization_failed_attempts)
    clear_attribute_changes([:authorization_failed_attempts])
  end

  def lock_authorization!
    write_authorization_lockout(
      authorization_failed_attempts: 0,
      authorization_locked_until: Settings.authorization_request_lock_period.from_now
    )
  end

  def write_authorization_lockout(**attributes)
    update_columns(**attributes) # rubocop:disable Rails/SkipsModelValidations
  end

  def encrypt_password(pass)
    plain = salt + pass + Settings.password_salt
    Digest::SHA256.hexdigest(plain)
  end
end
