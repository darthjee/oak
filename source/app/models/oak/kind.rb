# frozen_string_literal: true

module Oak
  class Kind < ApplicationRecord
    include Slugable

    # Validates the presence and uniqueness of name
    validates :name, presence: true, length: { maximum: 40 }

    has_many :items, class_name: 'Oak::Item', dependent: :destroy
    has_one :sample_item, -> { order(:id) }, class_name: 'Oak::Item', inverse_of: :kind
    has_one :main_photo, -> { where(ready: true).order(:id) }, class_name: 'Oak::Photo', through: :sample_item

    # Association with categories through category_kinds
    has_many :category_kinds, class_name: 'Oak::CategoryKind', dependent: :destroy
    has_many :categories, through: :category_kinds, source: :category
  end
end
