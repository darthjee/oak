# frozen_string_literal: true

module Auth
  class AuthorizationRequestsController < ApplicationController
    BOOLEAN_VALUES = [true, false].freeze

    protect_from_forgery except: %i[create]

    rescue_from Oak::Exception::InvalidParameter, with: :bad_request
    rescue_from Oak::Exception::TooManyRequests,  with: :too_many_requests

    before_action :force_skip_cache_header
    before_action :validate_create_params!, only: :create
    before_action :check_rate_limit!, only: :create

    def create
      render json: AuthorizationRequest::Decorator.new(created_request)
    end

    private

    def force_skip_cache_header
      response.set_header('X-Skip-Cache', 'true')
    end

    def validate_create_params!
      raise Oak::Exception::InvalidParameter, 'login is required' unless login_param?
      return if keep_signed_in_param.nil? || BOOLEAN_VALUES.include?(keep_signed_in_param)

      raise Oak::Exception::InvalidParameter, 'keepSignedIn must be a boolean'
    end

    def check_rate_limit!
      return if recent_requests_count < Settings.authorization_request_create_limit

      raise Oak::Exception::TooManyRequests, 'Too many authorization requests, try again later'
    end

    def recent_requests_count
      AuthorizationRequest.created_by_ip_since(
        request.remote_ip, Settings.authorization_request_create_window.ago
      ).count
    end

    def created_request
      AuthorizationRequest.create!(new_request_attributes).tap do |authorization_request|
        log_created(authorization_request)
      end
    end

    def new_request_attributes
      {
        login: params[:login],
        user: User.find_by(login: params[:login]),
        keep_signed_in: keep_signed_in_param == true,
        request_ip: request.remote_ip,
        request_user_agent: request.user_agent
      }
    end

    def log_created(authorization_request)
      Rails.logger.info(
        "[authorization_request] created uuid=#{authorization_request.uuid} " \
        "ip=#{authorization_request.request_ip} user_id=#{authorization_request.user_id.inspect}"
      )
    end

    def login_param?
      params[:login].is_a?(String) && params[:login].present?
    end

    def keep_signed_in_param
      params[:keepSignedIn]
    end

    def bad_request(exception)
      render json: { message: exception.message }, status: :bad_request
    end

    def too_many_requests(exception)
      render json: { message: exception.message }, status: :too_many_requests
    end
  end
end
