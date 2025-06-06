# frozen_string_literal: true

class AddDescriptionToItems < ActiveRecord::Migration[7.2]
  def change
    add_column :items, :description, :text, null: true
  end
end
