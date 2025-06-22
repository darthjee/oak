# frozen_string_literal: true

require 'spec_helper'

RSpec.describe CreateItemPhotosJob, type: :job do
  describe '#perform' do
    subject(:perform) { worker.perform(item.id) }

    let(:worker) { described_class.new }
    let(:item) { create(:oak_item, user:) }
    let(:user) { create(:user) }
    let(:photo_path) { "/tmp/photos_#{SecureRandom.hex(10)}" }
    let(:folder_path) { File.join(photo_path, "users/#{user.id}/items/#{item.id}") }
    let(:files) { %w[photo1.jpg photo2.jpeg photo3.png] }

    before do
      allow(Settings).to receive(:photos_path).and_return(photo_path)
    end

    after do
      FileUtils.rm_rf(photo_path)
    end

    context 'when the item exists' do
      before do
        FileUtils.mkdir_p(folder_path)
        files.each { |file| FileUtils.touch(File.join(folder_path, file)) }
      end

      it 'creates photos for the item' do
        expect { perform }.to change { item.photos.count }.by(files.size)
      end

      it 'creates photos with the correct file names' do
        perform

        expect(item.photos.pluck(:file_name)).to match_array(files)
      end
    end

    context 'when the item does not exist' do
      subject(:perform) { worker.perform(-1) }

      it 'does not create any photos' do
        expect { perform }.not_to change(Oak::Photo, :count)
      end
    end

    context 'when the folder does not contain valid files' do
      before do
        FileUtils.mkdir_p(folder_path)
      end

      let(:files) { %w[document.pdf text.txt] }

      it 'does not create any photos' do
        expect { perform }.not_to change(Oak::Photo, :count)
      end
    end

    context 'when the folder does not exist' do
      it 'does not create any photos' do
        expect { perform }.not_to change(Oak::Photo, :count)
      end
    end

    context 'when the photos already exist' do
      before do
        FileUtils.mkdir_p(folder_path)
        files.each do |file|
          FileUtils.touch(File.join(folder_path, file))
          item.photos.create!(file_name: file)
        end
      end

      it 'does not create duplicate photos' do
        expect { perform }.not_to change(Oak::Photo, :count)
      end
    end

    context 'when some photos already exist' do
      let(:existing_files) { %w[photo1.jpg] }
      let(:new_files) { %w[photo2.jpeg photo3.png] }

      before do
        FileUtils.mkdir_p(folder_path)
        (existing_files + new_files).each { |file| FileUtils.touch(File.join(folder_path, file)) }
        existing_files.each { |file| item.photos.create!(file_name: file) }
      end

      it 'creates only the new photos' do
        expect { perform }.to change { item.photos.count }.by(new_files.size)
      end

      it 'does not duplicate existing photos' do
        perform

        expect(item.photos.pluck(:file_name)).to match_array(existing_files + new_files)
      end
    end
  end
end
