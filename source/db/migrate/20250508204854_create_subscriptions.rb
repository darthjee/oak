class CreateSubscriptions < ActiveRecord::Migration[7.0]
  def change
    create_table :subscriptions do |t|
      t.bigint :user_id,     null: false
      t.bigint :category_id, null: false
      
      t.timestamps

      t.index %i[user_id category_id], unique: true

      t.foreign_key :users
      t.foreign_key :categories
    end
  end
end
