# frozen_string_literal: true

module Oak
  class Item
    class BaseBuilder < Sinclair::Model
      initialize_with({
                        name: nil,
                        description: nil,
                        category: nil,
                        kind: nil,
                        user: nil,
                        links: [],
                        visible: true
                      }, **{})

      def self.build(**params)
        new(**params).build
      end

      private

      def item_params
        {
          name:,
          description:,
          category:,
          kind:,
          user:,
          visible:
        }
      end
    end
  end
end
