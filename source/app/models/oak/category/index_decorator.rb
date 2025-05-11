# frozen_string_literal: true

module Oak
  class Category
    class IndexDecorator < MenuDecorator
      expose :snap_url

      def snap_url
        snap_url_components.join('/')
      end

      private

      def snap_url_components
        return [base_url, 'category.png'] unless object.items.any?

        [base_url, item.id, :snaps, :items, slug, "#{item.id}.png"]
      end

      def item
        object.items.first
      end

      def base_url
        Settings.photos_server_url
      end
    end
  end
end
