# frozen_string_literal: true

module UserRequired
  extend ActiveSupport::Concern

  included do
    include LoggedUser
    include Tarquinn

    redirection_rule :render_forbidden, :missing_user?
    skip_redirection_rule :render_root, :missing_user?
  end

  class_methods do
  end

  def render_forbidden
    '#/forbidden'
  end

  def missing_user?
    return false if logged_user
    return false unless action_name.to_sym == :new
    true
  end
end
