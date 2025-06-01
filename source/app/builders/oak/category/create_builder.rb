# frozen_string_literal: true

module Oak
  class Category
    class CreateBuilder < Sinclair::Model
      initialize_with({
                        scope: nil,
                        name: nil,
                        kinds: []
                      }, **{})

      def self.build(**params)
        new(**params).build
      end

      def build
        ActiveRecord::Base.transaction do
          build_kinds
          category.save!
        end
        category
      rescue ActiveRecord::RecordInvalid
        category
      end

      private

      def category
        @category ||= scope.build(category_params)
      end

      def scope
        @scope ||= Oak::Category.all
      end

      def category_params
        {
          name:
        }.compact
      end

      def build_kinds
        kinds.each do |kind_data|
          kind_slug = kind_data[:slug]
          kind = Oak::Kind.find_by(slug: kind_slug)
          next unless kind

          category.category_kinds.build(kind:)
        end
      end
    end
  end
end