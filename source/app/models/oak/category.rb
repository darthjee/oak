# frozen_string_literal: true

module Oak
  class Category < ApplicationRecord
    validates :name, presence: true, uniqueness: true

    validates :slug, presence: true, uniqueness: true
  end
end
