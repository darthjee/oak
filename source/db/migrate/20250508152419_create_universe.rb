# frozen_string_literal: true

class CreateUniverse < ActiveRecord::Migration[7.0]
  def change
    create_table :universes do |t|
      t.string :name, limit: 40
      t.string :slug, limit: 40

      t.timestamps

      t.index :name, unique: true
      t.index :slug, unique: true
    end
  end
end
