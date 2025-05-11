# frozen_string_literal: true

module Oak
  class Item
    class IndexDecorator < Azeroth::Decorator
      expose :id
      expose :name
      expose :snap_url

      def snap_url
        snap_url_components.join('/')
      end

      private

      def snap_url_components
        [base_url, user.id, :snaps, :items, category.slug, "#{id}.png"]
      end

      def base_url
        Settings.photos_server_url
      end
    end
  end
end