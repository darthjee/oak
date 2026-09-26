# frozen_string_literal: true

module Oak
  class Photo
    # Response shape for photos claimed by the legacy file migration.
    #
    # +legacy_path+ points to the current (legacy) file and +file_path+ to
    # the target UUID-named file, both relative to the photos storage roots.
    class MigrationDecorator < Azeroth::Decorator
      expose :id
      expose :legacy_path
      expose :file_path

      def legacy_path
        path_for(object.file_name)
      end

      def file_path
        path_for(object.migration_file_name)
      end

      private

      def path_for(file_name)
        "users/#{object.item.user_id}/items/#{object.item_id}/#{file_name}"
      end
    end
  end
end
