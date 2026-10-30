# frozen_string_literal: true

module Oak
  class Kind
    class CreateBuilder < Sinclair::Model
      initialize_with({
                        scope: nil,
                        name: nil,
                        categories: []
                      }, **{})

      def self.build(**params)
        new(**params).build
      end

      def build
        ActiveRecord::Base.transaction do
          build_categories
          kind.save!
        end
        kind
      rescue ActiveRecord::RecordInvalid
        kind
      end

      private

      def kind
        @kind ||= scope.build(kind_params)
      end

      def scope
        @scope ||= Oak::Kind.all
      end

      def kind_params
        {
          name:
        }.compact
      end

      def build_categories
        Oak::Category.where(slug: categories_slugs).find_each do |category|
          kind.category_kinds.build(category:)
        end
      end

      def categories_slugs
        Array(categories).pluck(:slug)
      end
    end
  end
end
