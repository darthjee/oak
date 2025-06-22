# frozen_string_literal: true

class ProcessUserItemPhotosJob
  include Sidekiq::Job

  def perform(user_id)
    @user_id = user_id
    process
  end

  private

  attr_reader :user_id

  def process
    item_ids.each do |item_id|
      CreateItemPhotosJob.perform_async(item_id)
    end
  end

  def item_ids
    directories_in(items_folder_path).map(&:to_i)
  end

  def items_folder_path
    @items_folder_path ||= File.join(Settings.photos_path, "users/#{user_id}/items")
  end

  def directories_in(path)
    FilesHelper.directories_in(path)
  end
end