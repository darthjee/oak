# frozen_string_literal: true

module Oak
  class Photo
    class CreateBuilder < Sinclair::Model
      initialize_with({
                        scope: nil,
                        file_name: nil
                      }, **{})

      def self.build(**params)
        new(**params).build
      end

      def build
        scope.build(photo_params)
      end

      private

      def scope
        @scope ||= Oak::Photo.all
      end

      def photo_params
        {
          file_name: unique_file_name,
          ready: false
        }
      end

      def unique_file_name
        "#{sanitized_stem}-#{SecureRandom.uuid}#{extension}"
      end

      def sanitized_stem
        stem = File.basename(file_name.to_s, extension).gsub(/[^a-zA-Z0-9_-]/, '_')
        stem.presence || 'photo'
      end

      def extension
        File.extname(file_name.to_s)
      end
    end
  end
end
