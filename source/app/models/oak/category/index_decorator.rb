# frozen_string_literal: true

module Oak
  class Category
    class IndexDecorator < Azeroth::Decorator
      expose :name
      expose :slug
      expose :snap_url

      def snap_url
        return [base_url, 'category.png'].join('/') if sample_item.nil?
        return [base_url, 'category.png'].join('/') if sample_item.main_photo.nil?

        Photo::FileUrl.call(sample_item.main_photo, :snap)
      end

      private

      def base_url
        Settings.photos_server_url
      end
    end
  end
end
