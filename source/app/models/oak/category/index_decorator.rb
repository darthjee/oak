# frozen_string_literal: true

module Oak
  class Category
    class IndexDecorator < MenuDecorator
      expose :snap_url

      def snap_url
        return [base_url, 'category.png'].join('/') unless object.items.any?

        Item::PhotoUrl.call(item, :snaps)
      end

      private

      def item
        object.items.first
      end

      def base_url
        Settings.photos_server_url
      end
    end
  end
end
