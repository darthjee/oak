# frozen_string_literal: true

class AddVisibleToItems < ActiveRecord::Migration[7.2]
  def change
    add_column :items, :visible, :boolean, default: true, null: false
  end
end
