# frozen_string_literal: true

module Oak
  class Category
    class MenuDecorator < Azeroth::Decorator
      expose :name
      expose :slug
    end
  end
end
