class CreateLinks < ActiveRecord::Migration[7.2]
  def change
    create_table :links do |t|
      t.bigint :item_id, null: false
      t.string :url,     null: false
      t.string :text,    null: false, limit: 255
      t.integer :order,  limit: 1

      t.timestamps

      t.foreign_key :items
    end
  end
end
