# frozen_string_literal: true

module LoggedUser
  extend ActiveSupport::Concern

  included do
    rescue_from Oak::Exception::LoginFailed, with: :not_found
    rescue_from Oak::Exception::NotLogged,   with: :not_found
  end

  private

  delegate :logged_user, :logged_session, to: :logged_user_processor

  def save_session
    logged_user_processor.login(user)
  end

  def destroy_session
    logged_user_processor.logoff
  end

  def logged_user_processor
    @logged_user_processor ||= Processor.new(self)
  end

  def check_logged!
    raise Oak::Exception::NotLogged unless logged_user
  end
end
