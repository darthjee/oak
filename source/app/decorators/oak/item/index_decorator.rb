# frozen_string_literal: true

module Oak
  class Item
    class IndexDecorator < ModelDecorator
      expose :id
      expose :name
      expose :description
      expose :category_slug
      expose :kind_slug
      expose :snap_url
      expose :main_link, as: :link, decorator: Oak::Link::Decorator

      def snap_url
        return [base_url, 'category.png'].join('/') if main_photo.nil?

        Photo::FileUrl.call(main_photo, :snap)
      end

      def category_slug
        object.category&.slug
      end

      def kind_slug
        object.kind&.slug
      end

      private

      def base_url
        Settings.photos_server_url
      end
    end
  end
end
