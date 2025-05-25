# frozen_string_literal: true

module Oak
  class Item
    class FormDecorator < ModelDecorator
      expose :id
      expose :name
      expose :description
      expose :category_slug
      expose :kind_slug
      expose :links, decorator: Oak::Link::Decorator

      def category_slug
        object.category&.slug
      end

      def kind_slug
        object.kind&.slug
      end
    end
  end
end
