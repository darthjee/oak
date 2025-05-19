# frozen_string_literal: true

module Oak
  class Item
    class ShowDecorator < ModelDecorator
      expose :id
      expose :name
      expose :category_slug
      expose :kind_slug
      expose :photos, decorator: Oak::Photo::Decorator
    end
  end
end
