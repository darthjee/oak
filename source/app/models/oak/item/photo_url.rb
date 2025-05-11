# frozen_string_literal: true

module Oak
  class Item < ApplicationRecord
    class PhotoUrl
      def self.call(*)
        new(*).call
      end

      def initialize(item, type)
        @item = item
        @type = type
      end

      def call
        [
          Settings.photos_server_url,
          user.id,
          type.to_s.pluralize,
          :items,
          category.slug,
          "#{id}.png"
        ].join('/')
      end

      private

      attr_reader :item, :type

      delegate :id, :user, :category, to: :item
    end
  end
end
