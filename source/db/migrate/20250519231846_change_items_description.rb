# frozen_string_literal: true

class ChangeItemsDescription < ActiveRecord::Migration[7.2]
  def change
    change_column_null :items, :description, false
  end
end
