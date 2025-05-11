# frozen_string_literal: true

module Oak
  class Item
    class IndexDecorator < Azeroth::Decorator
      expose :id
      expose :name
    end
  end
end