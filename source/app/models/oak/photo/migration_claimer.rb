# frozen_string_literal: true

module Oak
  class Photo < ApplicationRecord
    # Atomically claims photos for the legacy file migration.
    #
    # Each candidate is claimed with a single conditional +UPDATE+, so
    # concurrent callers never receive the same photo. A re-claimed (stale)
    # photo keeps its previously persisted +migration_file_name+.
    class MigrationClaimer
      CLAIM_SQL = <<~SQL.squish
        migration_status = ?,
        migration_file_name = COALESCE(migration_file_name, ?),
        migration_claimed_at = ?
      SQL

      def self.call(**)
        new(**).call
      end

      def initialize(scope:, limit:, now: Time.current)
        @scope = scope
        @limit = limit
        @now = now
      end

      def call
        claimed_ids = candidates.select { |photo| claimed?(photo) }.map(&:id)

        Oak::Photo.unscoped.includes(:item).where(id: claimed_ids).order(:id).to_a
      end

      private

      attr_reader :scope, :limit, :now

      def candidates
        claimable(scope).reorder(:id).limit(limit).to_a
      end

      def claimed?(photo)
        relation = claimable(Oak::Photo.unscoped.where(id: photo.id))

        relation.update_all([CLAIM_SQL, 'migrating', new_file_name(photo), now]) == 1 # rubocop:disable Rails/SkipsModelValidations
      end

      def claimable(relation)
        relation.where(migration_status: 'pending').or(
          relation.where(migration_status: 'migrating', migration_claimed_at: ...stale_before)
        )
      end

      def new_file_name(photo)
        Oak::Photo::UniqueFileName.build(photo.file_name)
      end

      def stale_before
        @stale_before ||= now - Oak::Photo::MIGRATION_CLAIM_TIMEOUT
      end
    end
  end
end
