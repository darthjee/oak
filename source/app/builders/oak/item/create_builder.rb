# frozen_string_literal: true

module Oak
  class Item
    class CreateBuilder
      def self.build(**params)
        new(**params).build
      end

      def initialize(**params)
        @params = params.slice(:name, :description, :category, :kind, :user)
      end

      def build
        Oak::Item.new(params)
      end

      private

      attr_reader :params
    end
  end
end