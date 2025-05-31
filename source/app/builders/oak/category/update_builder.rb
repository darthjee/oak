# frozen_string_literal: true

module Oak
  class Category
    class UpdateBuilder < Sinclair::Model
      initialize_with({
                        category: nil,
                        name: nil,
                        description: nil,
                        kinds: []
                      }, **{})

      def self.build(**params)
        new(**params).build
      end

      def build
        ActiveRecord::Base.transaction do
          update_category
          delete_removed_kinds
          update_kinds
          category.save!
        end
        category
      rescue ActiveRecord::RecordInvalid
        category
      end

      private

      attr_reader :category

      def update_category
        category.assign_attributes(category_params)
      end

      def category_params
        {
          name:,
          description:
        }
      end

      def update_kinds
        kinds.each do |kind_slug|
          kind = Oak::Kind.find_by(slug: kind_slug)
          next unless kind

          unless category.kinds.include?(kind)
            category.category_kinds.build(kind:)
          end
        end
      end

      def delete_removed_kinds
        payload_slugs = kinds
        category.kinds.where.not(slug: payload_slugs).each do |kind|
          category.category_kinds.find_by(kind: kind)&.destroy
        end
      end
    end
  end
end