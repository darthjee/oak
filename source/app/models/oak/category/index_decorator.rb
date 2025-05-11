# frozen_string_literal: true

module Oak
  class Category
    class IndexDecorator < MenuDecorator
      expose :snap_url

      def snap_url
        [base_url, 'category.png'].join('/')
      end

      private

      def base_url
        Settings.photos_server_url
      end
    end
  end
end