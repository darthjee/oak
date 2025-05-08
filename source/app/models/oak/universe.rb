module Oak
  class Universe < ApplicationRecord
    validates :name, presence: true, uniqueness: true

    validates :slug, presence: true, uniqueness: true
  end
end