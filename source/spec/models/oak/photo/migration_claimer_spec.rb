# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Photo::MigrationClaimer do
  describe '.call' do
    subject(:claimed) { described_class.call(scope:, limit:, now:) }

    let(:user) { create(:user) }
    let(:item) { create(:oak_item, user:) }
    let(:scope) { Oak::Photo.unscope(:order).joins(:item).where(items: { user_id: user.id }) }
    let(:limit) { 10 }
    let(:now) { Time.current.change(usec: 0) }
    let(:stale_time) { now - Oak::Photo::MIGRATION_CLAIM_TIMEOUT - 1.second }
    let(:fresh_time) { now - 1.minute }

    context 'with a pending photo' do
      let!(:photo) { create(:oak_photo, item:, file_name: 'cat.jpg') }

      it 'returns the claimed photo' do
        expect(claimed).to eq([photo])
      end

      it 'marks the photo as migrating' do
        claimed
        expect(photo.reload).to be_migration_migrating
      end

      it 'persists a UUID target name derived from the legacy name' do
        claimed
        expect(photo.reload.migration_file_name).to match(/\Acat-[0-9a-f-]{36}\.jpg\z/)
      end

      it 'records the claim timestamp' do
        claimed
        expect(photo.reload.migration_claimed_at).to eq(now)
      end

      it 'does not change the file name' do
        expect { claimed }.not_to(change { photo.reload.file_name })
      end
    end

    context 'when called twice' do
      before { create_list(:oak_photo, 2, item:) }

      let(:limit) { 1 }

      it 'does not return the already claimed photo again' do
        first = described_class.call(scope:, limit:, now:)

        expect(claimed).not_to eq(first)
      end

      it 'returns nothing once everything is claimed' do
        2.times { described_class.call(scope:, limit:, now:) }

        expect(claimed).to be_empty
      end
    end

    context 'with a stale migrating photo' do
      let!(:photo) do
        create(:oak_photo, item:, migration_status: :migrating,
                           migration_file_name: 'kept-name.jpg', migration_claimed_at: stale_time)
      end

      it 're-claims the photo' do
        expect(claimed).to eq([photo])
      end

      it 'keeps the persisted target name' do
        claimed
        expect(photo.reload.migration_file_name).to eq('kept-name.jpg')
      end

      it 'refreshes the claim timestamp' do
        claimed
        expect(photo.reload.migration_claimed_at).to eq(now)
      end
    end

    context 'with photos that are not claimable' do
      before do
        create(:oak_photo, item:, migration_status: :migrating,
                           migration_file_name: 'fresh.jpg', migration_claimed_at: fresh_time)
        create(:oak_photo, item:, migration_status: :migrated)
        create(:oak_photo, item:, migration_status: :missing)
      end

      it 'skips them' do
        expect(claimed).to be_empty
      end
    end

    context 'when the photo is claimed between selection and update' do
      let!(:photo) { create(:oak_photo, item:) }

      before do
        allow(Oak::Photo::UniqueFileName).to receive(:build).and_wrap_original do |original, *args|
          Oak::Photo.unscoped.where(id: photo.id).update_all( # rubocop:disable Rails/SkipsModelValidations
            migration_status: 'migrating', migration_claimed_at: now
          )
          original.call(*args)
        end
      end

      it 'does not return the photo' do
        expect(claimed).to be_empty
      end
    end

    context 'with more candidates than the limit' do
      let(:limit) { 2 }
      let!(:photos) { create_list(:oak_photo, 3, item:) }

      it 'claims only up to the limit, in id order' do
        expect(claimed).to eq(photos.first(2))
      end
    end

    context 'with photos outside the scope' do
      before { create(:oak_photo) }

      it 'does not claim them' do
        expect(claimed).to be_empty
      end
    end
  end
end
