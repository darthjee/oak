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
        ActiveRecord::Base.transaction do
          update_item
          delete_removed_links
          update_links
          item.save!
          item.links.each(&:save!)
        end
        item
      rescue ActiveRecord::RecordInvalid
        item
      end

      private

      attr_reader :item

      def update_item
        item.assign_attributes(item_params)
      end

      def item_params
        {
          name:,
          description:,
          category:,
          kind:,
          user:
        }
      end

      def update_links
        item.links = links.map do |link_data|
          if link_data[:id].present?
            link = item.links.find(link_data[:id])
            link.assign_attributes(link_data)
            link
          else
            item.links.build(link_data)
          end
        end
      end

      def delete_removed_links
        payload_ids = links.map { |link| link[:id] }.compact
        item.links.where.not(id: payload_ids).destroy_all
      end
    end
  end
end