# frozen_string_literal: true

class ApplicationController < ActionController::Base
  include Azeroth::Resourceable

  helper Magicka::Helper

  after_action :set_skip_cache_header

  def forbidden
    head :forbidden
  end

  private

  def set_skip_cache_header
    response.set_header('X-Skip-Cache', 'true') if cookies.signed[:session].present?
  end
end
