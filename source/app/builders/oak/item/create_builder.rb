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
        Oak::Item.new(params)
      end

      private

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