# frozen_string_literal: true

module Oak
  class Kind
    class Decorator < ModelDecorator
      expose :name
      expose :slug
    end
  end
end
