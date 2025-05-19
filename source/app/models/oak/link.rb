# frozen_string_literal: true

module Oak
  class Link < ApplicationRecord
    # Associations
    belongs_to :item

    # Validations
    validates :item, presence: true
    validates :url, presence: true, format: URI::DEFAULT_PARSER.make_regexp(%w[http https])
    validates :text, presence: true, length: { maximum: 255 }
    validates :order,
              numericality: {
                only_integer: true,
                greater_than_or_equal_to: -127,
                less_than_or_equal_to: 128
              },
              allow_nil: true

    # Scopes
    default_scope { order(Arel.sql('links.order IS NULL')).order(order: :asc, id: :asc) }
  end
end
