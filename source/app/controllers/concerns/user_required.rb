# frozen_string_literal: true

module UserRequired
  extend ActiveSupport::Concern

  included do
    include LoggedUser
    include Tarquinn

    redirection_rule :render_forbidden, :missing_user?
    skip_redirection_rule :render_root, :missing_user?

    delegate :require_user_actions, to: :class
  end

  class_methods do
    def require_user_for(*actions)
      require_user_actions.merge(actions.map(&:to_sym))
    end

    def require_user_actions
      @require_user_actions ||= Set.new
    end
  end

  def render_forbidden
    '#/forbidden'
  end

  def missing_user?
    return false if logged_user
    return false unless require_user_actions.include?(action_name.to_sym)
    true
  end
end
