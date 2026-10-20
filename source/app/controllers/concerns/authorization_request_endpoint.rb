# frozen_string_literal: true

# Shared setup for the device authorization JSON endpoints: the
# X-Skip-Cache header, 400 business errors and the audit log format.
module AuthorizationRequestEndpoint
  extend ActiveSupport::Concern

  included do
    rescue_from Oak::Exception::InvalidParameter, with: :bad_request

    before_action :force_skip_cache_header
  end

  private

  def force_skip_cache_header
    response.set_header('X-Skip-Cache', 'true')
  end

  def session_processor
    @session_processor ||= LoggedUser::Processor.new(self)
  end

  def log_event(event, authorization_request, ip:)
    Rails.logger.info(
      "[authorization_request] #{event} uuid=#{authorization_request.uuid} " \
      "ip=#{ip} user_id=#{authorization_request.user_id.inspect}"
    )
  end

  def bad_request(exception)
    render json: { message: exception.message }, status: :bad_request
  end
end
