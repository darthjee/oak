# frozen_string_literal: true

module Oak
  class Kind < ApplicationRecord
    # Validates the presence and uniqueness of name and slug
    validates :name, presence: true
    validates :slug, presence: true, uniqueness: true

    # Overrides the name= method to update the slug
    def name=(value)
      super(value)
      self.slug = value
    end

    private

    def slug=(value)
      super(value&.to_s&.underscore)
    end
  end
end
