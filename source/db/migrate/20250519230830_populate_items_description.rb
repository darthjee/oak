# frozen_string_literal: true

class PopulateItemsDescription < ActiveRecord::Migration[7.2]
  def up
    execute <<~SQL
      UPDATE items
      SET description = name
    SQL
  end

  def down
    execute <<~SQL
      UPDATE items
      SET description = NULL
    SQL
  end
end
