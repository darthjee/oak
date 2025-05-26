# frozen_string_literal: true

module Slugable
  extend ActiveSupport::Concern

  included do
    # Validates the presence and uniqueness of slug
    validates :slug, presence: true, uniqueness: true

    # Overrides the name= method to update the slug
    def name=(value)
      super
      self.slug = value
    end

    private

    # Private setter for slug
    def slug=(value)
      super(value&.to_s&.gsub(/ +/, '_')&.underscore)
    end
  end
end
