# frozen_string_literal: true

class ChangeReadyDefaultOnPhotos < ActiveRecord::Migration[7.2]
  def change
    change_column_default :photos, :ready, from: true, to: false
  end
end
