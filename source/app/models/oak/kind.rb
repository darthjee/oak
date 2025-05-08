# frozen_string_literal: true

module Oak
  class Kind < ApplicationRecord
    include Slugable
    # Validates the presence and uniqueness of name and slug
    validates :name, presence: true
  end
end
