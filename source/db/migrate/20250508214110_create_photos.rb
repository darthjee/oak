# frozen_string_literal: true

class CreatePhotos < ActiveRecord::Migration[7.0]
  def change
    create_table :photos do |t|
      t.bigint :item_id, null: false
      t.integer :order,  limit: 1, default: 127

      t.timestamps

      t.foreign_key :items
    end
  end
end
