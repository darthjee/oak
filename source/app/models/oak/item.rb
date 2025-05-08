# frozen_string_literal: true

module Oak
  class Item < ApplicationRecord
    belongs_to :user

    validates :name, presence: true
  end
end
