# frozen_string_literal: true

module Oak
  class Kind
    class SelectDecorator < ModelDecorator
      expose :name
      expose :slug
    end
  end
end
