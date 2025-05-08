# frozen_string_literal: true

class CreateCategories < ActiveRecord::Migration[7.0]
  def change
    create_table :categories do |t|
      t.string :name, limit: 40, null: false
      t.string :slug, limit: 40, null: false

      t.timestamps

      t.index :slug, unique: true
    end
  end
end
