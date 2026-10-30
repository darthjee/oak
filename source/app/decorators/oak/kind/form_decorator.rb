# frozen_string_literal: true

module Oak
  class Kind
    class FormDecorator < ModelDecorator
      expose :name
      expose :slug
      expose :snap_url
      expose :categories, decorator: Oak::Category::SelectDecorator

      def snap_url
        return '/assets/images/kind.png' if main_photo.nil?

        Photo::FileUrl.call(main_photo, :snap)
      end
    end
  end
end
