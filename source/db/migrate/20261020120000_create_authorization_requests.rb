# frozen_string_literal: true

class CreateAuthorizationRequests < ActiveRecord::Migration[7.2]
  def change
    create_table :authorization_requests do |t|
      add_identity_columns(t)
      add_requester_columns(t)
      t.timestamps
    end

    add_indexes
  end

  private

  def add_identity_columns(table)
    table.string :uuid, limit: 36, null: false
    table.references :user, null: true, foreign_key: true, index: false
    table.string :login, null: false
    table.string :poll_token_digest, limit: 64, null: false
    table.string :status, null: false, default: 'open'
  end

  def add_requester_columns(table)
    table.boolean :keep_signed_in, null: false, default: false
    table.string :request_ip
    table.string :request_user_agent, limit: 512
    table.datetime :expires_at, null: false
  end

  def add_indexes
    add_index :authorization_requests, :uuid, unique: true
    add_index :authorization_requests, %i[user_id status]
    add_index :authorization_requests, %i[request_ip created_at]
  end
end
