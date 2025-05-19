# frozen_string_literal: true

module Oak
  class Photo
    class Decorator < ModelDecorator
      expose :photo_url
      expose :snap_url

      def photo_url
        Photo::FileUrl.call(object, :photo)
      end

      def snap_url
        Photo::FileUrl.call(object, :snap)
      end
    end
  end
end
