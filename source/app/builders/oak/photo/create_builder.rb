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
          file_name: Oak::Photo::UniqueFileName.build(file_name),
          ready: false,
          migration_status: :migrated
        }
      end
    end
  end
end
