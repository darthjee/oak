# frozen_string_literal: true

class CreateItemPhotosJob
  include Sidekiq::Job

  def perform(item_id)
    @item_id = item_id
    process
  end

  private

  attr_reader :item_id

  def process
    return unless item

    files.each do |file_name|
      item.photos.create!(file_name:)
    end
  end

  def files
    FilesHelper.files_in(folder_path, extension: %w[jpg jpeg png])
  end

  def item
    @item ||= Oak::Item.find_by(id: item_id)
  end

  def user_id
    @user_id ||= item&.user_id
  end

  def folder_path
    @folder_path ||= File.join(Settings.photos_path, "users/#{user_id}/items/#{item_id}")
  end
end