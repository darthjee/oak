# frozen_string_literal: true

module Oak
  class Item < ApplicationRecord
    belongs_to :user
    belongs_to :category
    belongs_to :kind

    has_many :photos, class_name: 'Oak::Photo', dependent: :destroy

    validates :name, presence: true, length: { maximum: 100 }
  end
end