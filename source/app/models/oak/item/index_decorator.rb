# frozen_string_literal: true

module Oak
  class Item
    class IndexDecorator < Azeroth::Decorator
      expose :id
      expose :name
      expose :snap_url

      def snap_url
        Item::PhotoUrl.call(object, :snap)
      end

      private

      def base_url
        Settings.photos_server_url
      end
    end
  end
end
