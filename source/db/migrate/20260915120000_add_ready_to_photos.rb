# frozen_string_literal: true

class AddReadyToPhotos < ActiveRecord::Migration[7.2]
  def change
    add_column :photos, :ready, :boolean, default: true, null: false
  end
end
