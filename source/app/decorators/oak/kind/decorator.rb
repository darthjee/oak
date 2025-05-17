# frozen_string_literal: true

module Oak
  class Kind
    class Decorator < Azeroth::Decorator
      expose :name
      expose :slug
    end
  end
end
