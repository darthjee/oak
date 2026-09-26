# frozen_string_literal: true

module Oak
  class Photo < ApplicationRecord
    MIGRATION_CLAIM_TIMEOUT = 5.minutes
    UUID_FILE_NAME_REGEX = /-\h{8}-\h{4}-\h{4}-\h{4}-\h{12}\.[^.]+\z/i

    # Associations
    belongs_to :item

    # Validations
    validates :order,
              numericality: {
                only_integer: true,
                greater_than_or_equal_to: -127,
                less_than_or_equal_to: 128
              },
              allow_nil: true
    validates :file_name, presence: true, uniqueness: { scope: :item_id }

    # Enums
    enum :migration_status, {
      pending: 'pending',
      migrating: 'migrating',
      migrated: 'migrated',
      missing: 'missing'
    }, prefix: :migration

    # Scopes
    default_scope { order(Arel.sql('photos.order IS NULL')).order(order: :asc, id: :asc) }

    def self.uuid_file_name?(file_name)
      UUID_FILE_NAME_REGEX.match?(file_name.to_s)
    end
  end
end
