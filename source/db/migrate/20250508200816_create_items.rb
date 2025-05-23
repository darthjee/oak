# frozen_string_literal: true

class CreateItems < ActiveRecord::Migration[7.0]
  def change
    create_table :items do |t|
      t.bigint :user_id,     null: false
      t.string :name,        null: false, limit: 100
      t.bigint :category_id, null: false
      t.bigint :kind_id,     null: false

      t.timestamps

      t.foreign_key :users
      t.foreign_key :categories
      t.foreign_key :kinds
    end
  end
end
