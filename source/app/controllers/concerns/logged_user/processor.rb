# frozen_string_literal: true

module LoggedUser
  SESSION_KEY = :session

  class Processor
    def initialize(controller)
      @controller = controller
    end

    def login(user, keep_signed_in: false)
      @logged_user = user
      @keep_signed_in = keep_signed_in

      signed_cookies[SESSION_KEY] = session_cookie(new_session)
    end

    def logoff
      session&.update(expiration: 1.second.ago)
      cookies.delete(SESSION_KEY)
    end

    def logged_user
      @logged_user ||= session&.user
    end

    def session
      @session ||= session_from_cookie || session_from_headers
    end

    alias logged_session session

    private

    attr_reader :controller, :keep_signed_in

    def new_session
      @session = logged_user.sessions.create(
        expiration: session_period.from_now
      )
    end

    def session_period
      keep_signed_in ? Settings.long_session_period : Settings.session_period
    end

    def session_cookie(new_session)
      return new_session.id unless keep_signed_in

      { value: new_session.id, expires: new_session.expiration }
    end

    def session_from_cookie
      active_sessions.find_by(id: session_id)
    end

    def session_from_headers
      active_sessions.find_by(token:)
    end

    def session_id
      signed_cookies[SESSION_KEY]
    rescue NoMethodError
      nil
    end

    def token
      headers['Authorization']&.gsub(/Bearer */, '')
    end

    def signed_cookies
      @signed_cookies ||= cookies.signed
    end

    def active_sessions
      Session.active
    end

    def cookies
      @cookies ||= controller.send(:cookies)
    end

    def headers
      @headers ||= controller.send(:headers)
    end

    def params
      @params ||= controller.send(:params)
    end
  end
end
