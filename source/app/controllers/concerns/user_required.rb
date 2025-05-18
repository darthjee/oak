# frozen_string_literal: true

module UserRequired
  extend ActiveSupport::Concern

  included do
    include LoggedUser
  end
end
