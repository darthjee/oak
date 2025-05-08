# frozen_string_literal: true

class CreateKinds < ActiveRecord::Migration[7.0]
  def change
    create_table :kinds do |t|
      t.string :name, limit: 40, null: false
      t.string :slug, limit: 40, null: false

      t.timestamps

      t.index :name, unique: true
      t.index :slug, unique: true
    end
  end
end
