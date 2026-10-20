# frozen_string_literal: true

class AddAuthorizationLockoutToUsers < ActiveRecord::Migration[7.2]
  def change
    change_table :users, bulk: true do |t|
      t.integer :authorization_failed_attempts, null: false, default: 0
      t.datetime :authorization_locked_until, null: true
    end
  end
end
