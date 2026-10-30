# frozen_string_literal: true

module Oak
  class Category
    class SelectDecorator < ModelDecorator
      expose :name
      expose :slug
    end
  end
end
