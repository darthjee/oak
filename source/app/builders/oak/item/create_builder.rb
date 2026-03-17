# frozen_string_literal: true

module Oak
  class Item
    class CreateBuilder < BaseBuilder
      def initialize(scope: nil, **attributes)
        super(**attributes)
        @scope = scope
      end

      def build
        build_links
        item
      end

      private

      def item
        @item ||= scope.build(item_params)
      end

      def scope
        @scope ||= Oak::Item.all
      end

      def build_links
        links.each do |link_data|
          item.links.build(link_data)
        end
      end
    end
  end
end
