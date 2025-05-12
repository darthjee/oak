class AddFileNameToPhotos < ActiveRecord::Migration[7.2]
  def change
    add_column :photos, :file_name, :string, null: false
    
    add_index :photos, %i[item_id file_name], unique: true
  end
end