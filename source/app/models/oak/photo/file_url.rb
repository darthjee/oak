# frozen_string_literal: true

module Oak
  class Photo < ApplicationRecord
    class FileUrl
      def self.call(*)
        new(*).call
      end

      def initialize(photo, type)
        @photo = photo
        @type = type
      end

      def call
        [
          Settings.photos_server_url,
          user.id,
          type.to_s.pluralize,
          :items,
          category.slug,
          item.id,
          file_name
        ].join('/')
      end

      private

      attr_reader :photo, :type

      delegate :item, :file_name, to: :photo
      delegate :user, :category, to: :item
    end
  end
end
