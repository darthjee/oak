# frozen_string_literal: true

module Oak
  class Category
    class FormDecorator < ModelDecorator
      expose :name
      expose :slug
      expose :snap_url
      expose :kinds, decorator: Oak::Kind::Decorator

      def snap_url
        return [base_url, 'category.png'].join('/') if main_photo.nil?

        Photo::FileUrl.call(main_photo, :snap)
      end

      private

      def base_url
        Settings.photos_server_url
      end
    end
  end
end
