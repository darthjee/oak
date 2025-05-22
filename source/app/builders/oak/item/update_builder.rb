# frozen_string_literal: true

module Oak
  class Item
    class UpdateBuilder < Sinclair::Model
      initialize_with({
                        item: nil,
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
        update_item
        update_links
        item
      end

      private

      attr_reader :item

      def update_item
        item.assign_attributes(item_params)
        item.save
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

      def update_links
        update_existing_links
        create_new_links
      end

      def existing_links
        links.select { |link| link[:id].present? }
      end

      def new_links
        links.reject { |link| link[:id].present? }
      end

      def update_existing_links(
        existing_links.each do |link_data|
          link = item.links.find_by(id: link_data[:id])
          next unless link

          link.assign_attributes(link_data.except(:id))
          link.save
        end
      end

      def create_new_links
        new_links.each do |link_data|
          item.links.build(link_data)
        end
      end
    end
  end
end