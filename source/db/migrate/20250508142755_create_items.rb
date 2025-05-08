# frozen_string_literal: true

class CreateItems < ActiveRecord::Migration[7.0]
  def change
    create_table :items do |t|
      t.bigint :user_id, null: false
      t.string :name

      t.timestamps

      t.foreign_key :users
    end
  end
end
