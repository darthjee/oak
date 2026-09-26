# frozen_string_literal: true

class User < ApplicationRecord
  module Photos
    class MigrationsController < ApplicationController
      include LoggedUser

      DEFAULT_LIMIT = 10
      LIMIT_RANGE = (1..50)
      PENDING_STATUSES = %w[pending migrating].freeze
      MIGRATED_SQL = "file_name = migration_file_name, migration_status = 'migrated'"

      protect_from_forgery except: %i[prepare update]

      before_action :require_logged_user!

      def prepare
        remaining = user_photos.where(migration_status: PENDING_STATUSES).count
        photos = Oak::Photo::MigrationClaimer.call(scope: user_photos, limit:)

        render json: { photos: Oak::Photo::MigrationDecorator.new(photos).as_json, remaining: }
      end

      def update
        confirm_migrated
        confirm_missing

        head :ok
      end

      private

      def require_logged_user!
        head :unauthorized unless logged_user
      end

      def user_photos
        Oak::Photo.unscope(:order).joins(:item).where(items: { user_id: logged_user.id }, ready: true)
      end

      # rubocop:disable Rails/SkipsModelValidations
      def confirm_migrated
        migrating_photos.where(id: migrated_ids).where.not(migration_file_name: nil).update_all(MIGRATED_SQL)
      end

      def confirm_missing
        migrating_photos.where(id: missing_ids - migrated_ids).update_all(migration_status: 'missing')
      end
      # rubocop:enable Rails/SkipsModelValidations

      def migrating_photos
        Oak::Photo.unscoped.where(
          item_id: Oak::Item.where(user_id: logged_user.id).select(:id),
          migration_status: 'migrating'
        )
      end

      def migrated_ids
        @migrated_ids ||= ids_param(:migrated)
      end

      def missing_ids
        ids_param(:missing)
      end

      def ids_param(key)
        values = params[key]
        return [] unless values.is_a?(Array)

        values.filter_map { |id| Integer(id.to_s, exception: false) }
      end

      def limit
        (Integer(params[:limit], exception: false) || DEFAULT_LIMIT).clamp(LIMIT_RANGE)
      end
    end
  end
end
