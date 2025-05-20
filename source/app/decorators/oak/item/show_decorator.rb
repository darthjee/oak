# frozen_string_literal: true

module Oak
  class Item
    class ShowDecorator < ModelDecorator
      expose :id
      expose :name
      expose :description
      expose :category, decorator: Oak::Category::Decorator
      expose :kind, decorator: Oak::Kind::Decorator
      expose :photos, decorator: Oak::Photo::Decorator
      expose :links, decorator: Oak::Link::Decorator
    end
  end
end
