# frozen_string_literal: true

module Oak
  class Link
    class Decorator < ModelDecorator
      expose :text
      expose :url
    end
  end
end
