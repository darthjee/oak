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
                greater_than_or_equal_to: -127,
                less_than_or_equal_to: 128
              },
              allow_nil: true
    validates :file_name, presence: true, uniqueness: { scope: :item_id }

    # Scopes
    default_scope { order(Arel.sql('photos.order IS NULL')).order(order: :asc, id: :asc) }
  end
end
