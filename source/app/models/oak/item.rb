# frozen_string_literal: true

module Oak
  class Item < ApplicationRecord
    belongs_to :user
    belongs_to :category

    validates :name, presence: true
  end
end
