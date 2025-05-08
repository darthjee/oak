# frozen_string_literal: true

module Oak
  class Subscription < ApplicationRecord
    # Associations
    belongs_to :user
    belongs_to :category

    # Validations
    validates :user, presence: true
    validates :category, presence: true

    # Validates the uniqueness of the category within the scope of a user
    validates :category, uniqueness: { scope: :user, message: 'has already been subscribed by this user' }
  end
end
