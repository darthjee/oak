# frozen_string_literal: true

class CreateCategoryKinds < ActiveRecord::Migration[7.2]
  def change
    create_table :category_kinds do |t|
      t.references :category, null: false, foreign_key: true, index: true
      t.references :kind, null: false, foreign_key: true, index: true

      t.timestamps
    end

    add_index :category_kinds, %i[category_id kind_id], unique: true
  end
end
