# frozen_string_literal: true

module Auth
  # Approver side of the device authorization flow: a logged-in device
  # lists, authorizes or denies its user's open authorization requests.
  class AuthorizationRequestApprovalsController < ApplicationController
    include AuthorizationRequestEndpoint

    NOT_OPEN_MESSAGE = 'Authorization request is no longer open'

    protect_from_forgery except: %i[mine authorize deny]

    rescue_from Oak::Exception::NotLogged, with: :unauthorized

    before_action :check_logged!
    before_action :check_request!, only: %i[authorize deny]
    before_action :check_password!, only: :authorize

    def mine
      render json: { requests: AuthorizationRequest::ListDecorator.new(pending_requests).as_json }
    end

    def authorize
      logged_user.reset_authorization_failures!
      transition!(:authorize!, 'approved')
      render json: { authorized: true }
    end

    def deny
      transition!(:deny!, 'denied')
      render json: { denied: true }
    end

    private

    delegate :logged_user, to: :session_processor

    def check_logged!
      raise Oak::Exception::NotLogged, 'Login required' unless logged_user
    end

    def check_request!
      unless approvable_request&.owned_by?(logged_user)
        raise Oak::Exception::InvalidParameter, 'Authorization request not found'
      end
      return if approvable_request.current_status == 'open'

      raise Oak::Exception::InvalidParameter, NOT_OPEN_MESSAGE
    end

    def check_password!
      if logged_user.authorization_locked?
        raise Oak::Exception::InvalidParameter, 'Too many failed attempts, try again later'
      end
      return if correct_password?

      register_failure
      raise Oak::Exception::InvalidParameter, 'Invalid password'
    end

    def correct_password?
      return false unless password_param.is_a?(String) && password_param.present?

      logged_user.verify_password!(password_param)
      true
    rescue Oak::Exception::LoginFailed
      false
    end

    def register_failure
      log_approver_event('wrong password')
      log_approver_event('lockout triggered') if logged_user.register_authorization_failure!
    end

    def transition!(transition, event)
      raise Oak::Exception::InvalidParameter, NOT_OPEN_MESSAGE unless approvable_request.public_send(transition)

      log_approver_event(event)
    end

    def pending_requests
      AuthorizationRequest.pending_for(logged_user).to_a
    end

    def approvable_request
      return @approvable_request if defined?(@approvable_request)

      @approvable_request = AuthorizationRequest.find_by(uuid: params[:uuid])
    end

    def password_param
      params[:password]
    end

    def log_approver_event(event)
      log_event(event, approvable_request, ip: request.remote_ip)
    end

    def unauthorized(exception)
      render json: { message: exception.message }, status: :unauthorized
    end
  end
end
