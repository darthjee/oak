# frozen_string_literal: true

module Oak
  class Item < ApplicationRecord
    belongs_to :user
    belongs_to :category
    belongs_to :kind

    has_many :photos, class_name: 'Oak::Photo', dependent: :destroy
    has_many :links,  class_name: 'Oak::Link',  dependent: :destroy

    # Defines a main photo as the first photo based on the default scope of photos
    has_one :main_photo, class_name: 'Oak::Photo'
    has_one :main_link, class_name: 'Oak::Link'

    validates :name, presence: true, length: { maximum: 100 }
    validates :description, presence: true
    validates :order,
              numericality: {
                only_integer: true,
                greater_than_or_equal_to: -32_768,
                less_than_or_equal_to: 32_767
              },
              allow_nil: true

    scope :for_category, ->(category) { where(category:) }
    scope :for_user, ->(user) { where(user:) }
    scope :for_kind, ->(kind) { where(kind:) }


    default_scope { order(order: :asc, id: :asc) }
  end
end
