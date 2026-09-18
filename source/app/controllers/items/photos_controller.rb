# frozen_string_literal: true

module Items
  class PhotosController < ApplicationController
    include UserRequired

    protect_from_forgery except: %i[create update destroy]
    require_user_for :create, :update, :destroy, :deletable

    resource_for Oak::Photo,
                 only: %i[create update destroy],
                 decorator: Oak::Photo::UploadDecorator,
                 build_with: :build_photo

    model_for Oak::Item,
              id_key: :id,
              param_key: :item_id

    model_for Oak::Category,
              id_key: :slug,
              param_key: :category_slug

    before_action :ensure_owner!

    def update
      case params.require(:status)
      when 'uploading' then gate_uploading
      when 'ready' then finalize
      else head :unprocessable_content
      end
    end

    def deletable
      return head :unprocessable_content unless photo.ready?

      render json: { file_path: }, status: :ok
    end

    private

    def photos
      scope = item.photos
      action_name.in?(%w[index show]) ? scope.where(ready: true) : scope
    end

    def photo_params
      params.require(:photo).permit(:file_name)
    end

    def build_photo
      Oak::Photo::CreateBuilder.build(**create_params)
    end

    def create_params
      photo_params.to_h.symbolize_keys.merge(scope: photos)
    end

    def ensure_owner!
      forbidden unless item.user == logged_user
    end

    def gate_uploading
      return head :unprocessable_content if photo.ready?

      render json: { file_path: }, status: :ok
    end

    def finalize
      photo.update!(ready: true)

      render json: Oak::Photo::UploadDecorator.new(photo).as_json, status: :ok
    end

    def file_path
      "users/#{item.user_id}/items/#{item.id}/#{photo.file_name}"
    end
  end
end
