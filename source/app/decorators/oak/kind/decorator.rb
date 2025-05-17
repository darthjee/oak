# frozen_string_literal: true

module Oak
  class Kind
    class Decorator < ModelDecorator
      expose :name
      expose :slug
      expose :snap_url

      def snap_url
        return [base_url, 'kind.png'].join('/') if main_photo.nil?

        Photo::FileUrl.call(main_photo, :snap)
      end

      private

      def base_url
        Settings.photos_server_url
      end
    end
  end
end
