# frozen_string_literal: true

class RemoveMigrationStateFromPhotos < ActiveRecord::Migration[7.2]
  def up
    change_table :photos, bulk: true do |t|
      t.remove :migration_claimed_at, :migration_file_name, :migration_status
    end
  end

  def down
    change_table :photos, bulk: true do |t|
      t.string :migration_status, default: 'migrated', null: false
      t.string :migration_file_name
      t.datetime :migration_claimed_at
    end
  end
end
