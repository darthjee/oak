# frozen_string_literal: true

module Oak
  class Photo < ApplicationRecord
    # Associations
    belongs_to :item

    # Validations
    validates :item, presence: true
    validates :order,
      numericality: {
        only_integer: true,
        greater_than_or_equal_to: 0,
        less_than_or_equal_to: 128
      },
      allow_nil: true
  end
end