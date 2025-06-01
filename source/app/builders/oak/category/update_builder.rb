# frozen_string_literal: true

module Oak
  class Category
    class UpdateBuilder < Sinclair::Model
      initialize_with(
        :category, {
          name: nil,
          kinds: []
        }, **{}
      )

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
          name:
        }
      end

      def update_kinds
        new_kinds_ids.each do |kind_id|
          category.category_kinds.build(kind_id:)
        end
      end

      def delete_removed_kinds
        category
          .category_kinds
          .where.not(kind_id: kept_kinds_ids)
          .destroy_all
      end

      def kept_kinds_ids
        @kept_kinds_ids ||= category.kinds.where(slug: kinds).pluck(:id)
      end

      def new_kinds_ids
        @new_kinds_ids ||= Oak::Kind
                           .where(slug: kinds)
                           .where.not(id: kept_kinds_ids)
                           .pluck(:id)
      end
    end
  end
end
