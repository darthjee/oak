# frozen_string_literal: true

module Oak
  class Kind
    class UpdateBuilder < Sinclair::Model
      initialize_with(
        :kind, {
          name: nil,
          categories: nil
        }, **{}
      )

      def self.build(**params)
        new(**params).build
      end

      def build
        ActiveRecord::Base.transaction do
          kind.assign_attributes(name:)
          sync_categories unless categories.nil?
          kind.save!
        end
        kind
      rescue ActiveRecord::RecordInvalid
        kind
      end

      private

      attr_reader :kind

      def sync_categories
        delete_removed_categories
        add_new_categories
      end

      def delete_removed_categories
        kind
          .category_kinds
          .where.not(category_id: kept_categories_ids)
          .destroy_all
      end

      def add_new_categories
        new_categories_ids.each do |category_id|
          kind.category_kinds.build(category_id:)
        end
      end

      def kept_categories_ids
        @kept_categories_ids ||= kind.categories.where(slug: categories_slugs).pluck(:id)
      end

      def new_categories_ids
        @new_categories_ids ||= Oak::Category
                                .where(slug: categories_slugs)
                                .where.not(id: kept_categories_ids)
                                .pluck(:id)
      end

      def categories_slugs
        @categories_slugs ||= categories.pluck(:slug)
      end
    end
  end
end
