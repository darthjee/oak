# frozen_string_literal: true

module Oak
  class Photo < ApplicationRecord
    class UniqueFileName
      DEFAULT_STEM = 'photo'

      def self.build(file_name)
        new(file_name).build
      end

      def initialize(file_name)
        @file_name = file_name.to_s
      end

      def build
        "#{sanitized_stem}-#{SecureRandom.uuid}#{extension}"
      end

      private

      attr_reader :file_name

      def sanitized_stem
        stem = File.basename(file_name, extension).gsub(/[^a-zA-Z0-9_-]/, '_')
        stem.presence || DEFAULT_STEM
      end

      def extension
        @extension ||= File.extname(file_name)
      end
    end
  end
end
