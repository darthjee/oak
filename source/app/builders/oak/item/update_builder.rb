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
          update_links
        end
        item
      rescue ActiveRecord::RecordInvalid
        item
      end

      private

      attr_reader :item

      def update_item
        item.assign_attributes(item_params)
        item.save!
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
        update_existing_links
        delete_removed_links
        create_new_links
      end

      def existing_links
        links.select { |link| link[:id].present? }
      end

      def new_links
        links.reject { |link| link[:id].present? }
      end

      def update_existing_links
        existing_links.each do |link_data|
          link = item.links.find_by(id: link_data[:id])
          next unless link

          link.assign_attributes(link_data.except(:id))
          link.save!
        end
      end

      def create_new_links
        new_links.each do |link_data|
          item.links.create!(link_data)
        end
      end

      def delete_removed_links
        payload_ids = links.map { |link| link[:id] }.compact
        item.links.where.not(id: payload_ids).destroy_all
      end
    end
  end
end