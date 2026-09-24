# frozen_string_literal: true

module Oak
  class Category
    class FormDecorator < ModelDecorator
      expose :name
      expose :slug
      expose :snap_url
      expose :kinds, decorator: Oak::Kind::Decorator

      def snap_url
        return '/assets/images/category.png' if main_photo.nil?

        Photo::FileUrl.call(main_photo, :snap)
      end
    end
  end
end
