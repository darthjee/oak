# frozen_string_literal: true

module Oak
  class Subscription
    class Decorator < ModelDecorator
      expose :id
      expose :user_id
      expose :category_slug

      def category_slug
        object.category&.slug
      end
    end
  end
end