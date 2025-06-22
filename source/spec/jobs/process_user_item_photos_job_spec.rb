# frozen_string_literal: true

require 'spec_helper'

RSpec.describe ProcessUserItemPhotosJob, type: :job do
  describe '#perform' do
    subject(:perform) { worker.perform(user.id) }

    let(:worker) { described_class.new }
    let(:user) { create(:user) }
    let(:photo_path) { "/tmp/photos_#{SecureRandom.hex(10)}" }
    let(:items_folder_path) { File.join(photo_path, "users/#{user.id}/items") }
    let(:item_ids) { %w[1 2 3] }

    before do
      allow(Settings).to receive(:photos_path).and_return(photo_path)
      allow(CreateItemPhotosJob).to receive(:perform_async)
      FileUtils.mkdir_p(items_folder_path)
      item_ids.each { |item_id| FileUtils.mkdir_p(File.join(items_folder_path, item_id)) }
    end

    after do
      FileUtils.rm_rf(photo_path)
    end

    context 'when the user has item folders' do
      it 'calls CreateItemPhotosJob for each item folder' do
        perform

        item_ids.each do |item_id|
          expect(CreateItemPhotosJob).to have_received(:perform_async).with(item_id.to_i)
        end
      end
    end

    context 'when the user has no item folders' do
      before do
        FileUtils.rm_rf(items_folder_path)
      end

      it 'does not call CreateItemPhotosJob' do
        perform

        expect(CreateItemPhotosJob).not_to have_received(:perform_async)
      end
    end

    context 'when the items folder does not exist' do
      let(:items_folder_path) { File.join(photo_path, "users/#{user.id}/non_existent_items") }

      it 'does not call CreateItemPhotosJob' do
        perform

        expect(CreateItemPhotosJob).not_to have_received(:perform_async)
      end
    end
  end
end
