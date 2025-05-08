# frozen_string_literal: true

module Oak
  class Kind < ApplicationRecord
    include Slugable

    # Validates the presence and uniqueness of name
    validates :name, presence: true, length: { maximum: 40 }
  end
end