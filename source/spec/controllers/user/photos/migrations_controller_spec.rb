# frozen_string_literal: true

require 'spec_helper'

RSpec.describe User::Photos::MigrationsController do
  let(:response_json) { response.parsed_body }
  let(:user) { create(:user) }
  let(:session) { create(:session, user:) }
  let(:item) { create(:oak_item, user:) }

  before do
    cookies.signed[:session] = session.id if session
  end

  describe 'POST #prepare' do
    let(:parameters) { { format: :json } }
    let(:claimed_ids) { response_json['photos'].pluck('id') }

    context 'when the user is not logged in' do
      let(:session) { nil }

      before { create(:oak_photo, item:) }

      it 'returns unauthorized' do
        post :prepare, params: parameters

        expect(response).to have_http_status(:unauthorized)
      end

      it 'does not claim any photo' do
        expect { post :prepare, params: parameters }
          .not_to(change { Oak::Photo.migration_migrating.count })
      end
    end

    context 'when the user has a pending photo' do
      let!(:photo) { create(:oak_photo, item:, file_name: 'cat.jpg') }
      let(:base_path) { "users/#{user.id}/items/#{item.id}" }

      let(:expected) do
        {
          'photos' => [{
            'id' => photo.id,
            'legacy_path' => "#{base_path}/cat.jpg",
            'file_path' => "#{base_path}/#{photo.reload.migration_file_name}"
          }],
          'remaining' => 1
        }
      end

      before { post :prepare, params: parameters }

      it 'returns ok' do
        expect(response).to have_http_status(:ok)
      end

      it 'renders the claimed photo with legacy and target paths' do
        expect(response_json).to eq(expected)
      end

      it 'claims the photo' do
        expect(photo.reload).to be_migration_migrating
      end

      it 'targets a UUID file name' do
        expect(photo.reload.migration_file_name).to match(/\Acat-[0-9a-f-]{36}\.jpg\z/)
      end
    end

    context 'when called a second time' do
      let!(:photos) { create_list(:oak_photo, 3, item:) }

      before do
        post :prepare, params: parameters.merge(limit: 2)
        post :prepare, params: parameters.merge(limit: 2)
      end

      it 'returns only the photos not claimed by the first call' do
        expect(response.parsed_body['photos'].pluck('id')).to eq([photos.last.id])
      end

      it 'counts the photos still pending or migrating' do
        expect(response.parsed_body['remaining']).to eq(3)
      end
    end

    context 'with photos of other users and non-ready photos' do
      let!(:photo) { create(:oak_photo, item:) }

      before do
        create(:oak_photo)
        create(:oak_photo, item:, ready: false)
        post :prepare, params: parameters
      end

      it 'claims only the caller ready photos' do
        expect(claimed_ids).to eq([photo.id])
      end

      it 'counts only the caller ready photos as remaining' do
        expect(response_json['remaining']).to eq(1)
      end
    end

    context 'with photos in every migration state' do
      let(:stale_time) { Oak::Photo::MIGRATION_CLAIM_TIMEOUT.ago - 1.minute }
      let!(:pending) { create(:oak_photo, item:) }
      let!(:stale) do
        create(:oak_photo, item:, migration_status: :migrating,
                           migration_file_name: 'kept.jpg', migration_claimed_at: stale_time)
      end

      before do
        create(:oak_photo, item:, migration_status: :migrating,
                           migration_file_name: 'fresh.jpg', migration_claimed_at: 1.minute.ago)
        create(:oak_photo, item:, migration_status: :migrated)
        create(:oak_photo, item:, migration_status: :missing)
        post :prepare, params: parameters
      end

      it 'claims pending and stale migrating photos only' do
        expect(claimed_ids).to contain_exactly(pending.id, stale.id)
      end

      it 'keeps the persisted target name of a stale photo' do
        expect(stale.reload.migration_file_name).to eq('kept.jpg')
      end

      it 'counts pending and migrating photos before the batch' do
        expect(response_json['remaining']).to eq(3)
      end
    end

    context 'when every photo is already migrated' do
      before do
        create(:oak_photo, item:, migration_status: :migrated)
        post :prepare, params: parameters
      end

      it 'returns no photos' do
        expect(response_json['photos']).to be_empty
      end

      it 'returns zero remaining' do
        expect(response_json['remaining']).to eq(0)
      end
    end

    describe 'limit' do
      before do
        allow(Oak::Photo::MigrationClaimer).to receive(:call).and_call_original
        create_list(:oak_photo, 4, item:)
        post :prepare, params: parameters.merge(limit:).compact
      end

      shared_examples 'claims with limit' do |expected_limit|
        it "passes #{expected_limit} as the limit" do
          expect(Oak::Photo::MigrationClaimer)
            .to have_received(:call).with(scope: anything, limit: expected_limit)
        end
      end

      context 'when absent' do
        let(:limit) { nil }

        it_behaves_like 'claims with limit', 10
      end

      context 'when not numeric' do
        let(:limit) { 'abc' }

        it_behaves_like 'claims with limit', 10
      end

      context 'when below the minimum' do
        let(:limit) { 0 }

        it_behaves_like 'claims with limit', 1

        it 'claims a single photo' do
          expect(claimed_ids.size).to eq(1)
        end
      end

      context 'when above the maximum' do
        let(:limit) { 100 }

        it_behaves_like 'claims with limit', 50
      end

      context 'when within range' do
        let(:limit) { 3 }

        it_behaves_like 'claims with limit', 3

        it 'claims that many photos' do
          expect(claimed_ids.size).to eq(3)
        end
      end
    end
  end

  describe 'PATCH #update' do
    let(:parameters) { { migrated:, missing:, format: :json } }
    let(:migrated) { [] }
    let(:missing) { [] }

    let!(:photo) do
      create(:oak_photo, item:, file_name: 'cat.jpg', migration_status: :migrating,
                         migration_file_name: 'cat-new.jpg', migration_claimed_at: 1.minute.ago)
    end

    context 'when the user is not logged in' do
      let(:session) { nil }
      let(:migrated) { [photo.id] }

      before { patch :update, params: parameters }

      it 'returns unauthorized' do
        expect(response).to have_http_status(:unauthorized)
      end

      it 'does not change the photo' do
        expect(photo.reload).to be_migration_migrating
      end
    end

    context 'when the photo is reported as migrated' do
      let(:migrated) { [photo.id] }

      before { patch :update, params: parameters }

      it 'returns ok' do
        expect(response).to have_http_status(:ok)
      end

      it 'marks the photo as migrated' do
        expect(photo.reload).to be_migration_migrated
      end

      it 'swaps the file name to the target name' do
        expect(photo.reload.file_name).to eq('cat-new.jpg')
      end
    end

    context 'when the photo is reported as missing' do
      let(:missing) { [photo.id] }

      before { patch :update, params: parameters }

      it 'returns ok' do
        expect(response).to have_http_status(:ok)
      end

      it 'marks the photo as missing' do
        expect(photo.reload).to be_migration_missing
      end

      it 'keeps the legacy file name' do
        expect(photo.reload.file_name).to eq('cat.jpg')
      end
    end

    context 'when the photo is in both lists' do
      let(:migrated) { [photo.id] }
      let(:missing) { [photo.id] }

      before { patch :update, params: parameters }

      it 'marks the photo as migrated' do
        expect(photo.reload).to be_migration_migrated
      end

      it 'swaps the file name' do
        expect(photo.reload.file_name).to eq('cat-new.jpg')
      end
    end

    context 'when the photo belongs to another user' do
      let(:item) { create(:oak_item) }
      let(:migrated) { [photo.id] }

      before { patch :update, params: parameters }

      it 'returns ok' do
        expect(response).to have_http_status(:ok)
      end

      it 'leaves the photo untouched' do
        expect(photo.reload).to have_attributes(migration_status: 'migrating', file_name: 'cat.jpg')
      end
    end

    context 'when the photo is not migrating' do
      let!(:pending) { create(:oak_photo, item:, migration_file_name: 'pending-new.jpg') }
      let!(:missing_photo) { create(:oak_photo, item:, migration_status: :missing) }
      let(:migrated) { [pending.id] }
      let(:missing) { [missing_photo.id, pending.id] }

      before { patch :update, params: parameters }

      it 'leaves the pending photo untouched' do
        expect(pending.reload).to have_attributes(migration_status: 'pending', file_name: pending.file_name)
      end

      it 'leaves the missing photo missing' do
        expect(missing_photo.reload).to be_migration_missing
      end
    end

    context 'with unknown ids and junk values' do
      let(:migrated) { [0, 'abc'] }
      let(:missing) { [-1] }

      before { patch :update, params: parameters }

      it 'returns ok' do
        expect(response).to have_http_status(:ok)
      end

      it 'leaves existing photos untouched' do
        expect(photo.reload).to be_migration_migrating
      end
    end

    context 'when no lists are given' do
      before { patch :update, params: { format: :json } }

      it 'returns ok' do
        expect(response).to have_http_status(:ok)
      end

      it 'leaves existing photos untouched' do
        expect(photo.reload).to be_migration_migrating
      end
    end
  end
end
