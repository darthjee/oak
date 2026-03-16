# frozen_string_literal: true

class AddFileNameToPhotos < ActiveRecord::Migration[7.2]
  def change
    # rubocop:disable Rails/NotNullColumn
    add_column :photos, :file_name, :string, null: false
    # rubocop:enable Rails/NotNullColumn
    
    add_index :photos, %i[item_id file_name], unique: true
  end
end
