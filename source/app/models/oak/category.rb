# frozen_string_literal: true

module Oak
  class Category < ApplicationRecord
    include Slugable

    # Validates the presence and uniqueness of name
    validates :name, presence: true, length: { maximum: 40 }

    has_many :items, class_name: 'Oak::Item', foreign_key: :category_id, dependent: :destroy
    has_one :sample_item, -> { order(:id) }, class_name: 'Oak::Item'
  end
end
