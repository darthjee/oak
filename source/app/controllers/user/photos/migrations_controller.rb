# frozen_string_literal: true

class User < ApplicationRecord
  module Photos
    class MigrationsController < ApplicationController
      include LoggedUser

      DEFAULT_LIMIT = 10
      LIMIT_RANGE = (1..50)
      PENDING_STATUSES = %w[pending migrating].freeze

      protect_from_forgery except: %i[prepare update]

      before_action :require_logged_user!

      def prepare
        remaining = user_photos.where(migration_status: PENDING_STATUSES).count
        photos = Oak::Photo::MigrationClaimer.call(scope: user_photos, limit:)

        render json: { photos: Oak::Photo::MigrationDecorator.new(photos).as_json, remaining: }
      end

      private

      def require_logged_user!
        head :unauthorized unless logged_user
      end

      def user_photos
        Oak::Photo.unscope(:order).joins(:item).where(items: { user_id: logged_user.id }, ready: true)
      end

      def limit
        (Integer(params[:limit], exception: false) || DEFAULT_LIMIT).clamp(LIMIT_RANGE)
      end
    end
  end
end
