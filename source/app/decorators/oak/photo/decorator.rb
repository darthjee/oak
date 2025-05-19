# frozen_string_literal: true

module Oak
  class Photo
    class Decorator < ModelDecorator
      expose :snap_url

      def snap_url
        Photo::FileUrl.call(object, :snap)
      end
    end
  end
end
