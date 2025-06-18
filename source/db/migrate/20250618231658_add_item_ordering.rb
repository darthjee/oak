class AddItemOrdering < ActiveRecord::Migration[7.2]
  def change
    add_column :items, :order, :integer, default: 0, limit: 2, null: false
  end
end
