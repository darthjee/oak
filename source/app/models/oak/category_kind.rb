# frozen_string_literal: true

module Oak
  class CategoryKind < ApplicationRecord
    # Associations
    belongs_to :category, class_name: 'Oak::Category'
    belongs_to :kind, class_name: 'Oak::Kind'

    # Validations
    validates :category, presence: true
    validates :kind, presence: true

    # Validates the uniqueness of the kind within the scope of a category
    validates :kind, uniqueness: { scope: :category, message: 'has already been associated with this category' }
  end
end
