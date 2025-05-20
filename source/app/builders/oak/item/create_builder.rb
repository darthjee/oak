# frozen_string_literal: true

module Oak
  class Item
    class CreateBuilder < Sinclair::Model
      initialize_with({
        scope: nil,
        name: nil,
        description: nil,
        category: nil,
        kind: nil,
        user: nil,
      }, **{})

      def self.build(**params)
        new(**params).build
      end

      def build
        scope.build(params)
      end

      private

      def scope
        @scope ||= Oak::Item.all
      end

      def params
        @params ||= {
          name:,
          description:,
          category:,
          kind:,
          user:
        }.compact
      end
    end
  end
end