# frozen_string_literal: true

class LoginController < ApplicationController
  include LoggedUser

  BOOLEAN_VALUES = [true, false].freeze

  protect_from_forgery except: %i[create logoff]

  rescue_from Oak::Exception::InvalidParameter, with: :bad_request

  before_action :validate_keep_signed_in!, only: :create
  before_action :save_session, only: :create
  before_action :check_logged!, only: :check

  def create
    render json: Session::Decorator.new(logged_session)
  end

  def check
    render json: Session::Decorator.new(logged_session)
  end

  def logoff
    destroy_session
    head :ok
  end

  private

  def user
    @user ||= User.login(**login_params)
  end

  def login_params
    params.require(:login).permit(:login, :password)
          .to_h.symbolize_keys
  end

  def validate_keep_signed_in!
    return if keep_signed_in_param.nil?
    return if BOOLEAN_VALUES.include?(keep_signed_in_param)

    raise Oak::Exception::InvalidParameter, 'keepSignedIn must be a boolean'
  end

  def keep_signed_in?
    keep_signed_in_param == true
  end

  def keep_signed_in_param
    params.dig(:login, :keepSignedIn)
  end

  def bad_request(exception)
    render json: { message: exception.message }, status: :bad_request
  end
end
