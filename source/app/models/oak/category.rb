# frozen_string_literal: true

module Oak
  class Category < ApplicationRecord
    # Validates the presence and uniqueness of name and slug
    validates :name, presence: true, uniqueness: true
    validates :slug, presence: true, uniqueness: true

    # Overrides the name= method to update the slug
    def name=(value)
      super(value)
      self.slug = value&.to_s&.underscore
    end

    private

    # Private setter for slug
    def slug=(value)
      super(value)
    end
  end
end