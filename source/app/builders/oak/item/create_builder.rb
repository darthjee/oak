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
        links: []
      }, **{})

      def self.build(**params)
        new(**params).build
      end

      def build
        @item = scope.build(item_params)
        build_links
        @item
      end

      private

      def scope
        @scope ||= Oak::Item.all
      end

      def item_params
        {
          name:,
          description:,
          category:,
          kind:,
          user:
        }.compact
      end

      def build_links
        links.each do |link_data|
          @item.links.build(link_data)
        end
      end
    end
  end
end