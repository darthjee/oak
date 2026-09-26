# frozen_string_literal: true

class AddMigrationStateToPhotos < ActiveRecord::Migration[7.2]
  UUID_FILE_NAME_REGEX = /-\h{8}-\h{4}-\h{4}-\h{4}-\h{12}\.[^.]+\z/i

  def up
    change_table :photos, bulk: true do |t|
      t.string :migration_status, default: 'pending', null: false
      t.string :migration_file_name
      t.datetime :migration_claimed_at
    end

    backfill_migrated
  end

  def down
    change_table :photos, bulk: true do |t|
      t.remove :migration_claimed_at, :migration_file_name, :migration_status
    end
  end

  private

  def backfill_migrated
    photo_model.reset_column_information

    photo_model.select(:id, :file_name).find_in_batches do |batch|
      ids = batch.select { |photo| UUID_FILE_NAME_REGEX.match?(photo.file_name) }.map(&:id)
      next if ids.empty?

      # Backfill must bypass the application model on purpose.
      photo_model.where(id: ids).update_all(migration_status: 'migrated') # rubocop:disable Rails/SkipsModelValidations
    end
  end

  def photo_model
    @photo_model ||= Class.new(ActiveRecord::Base) { self.table_name = 'photos' }
  end
end
