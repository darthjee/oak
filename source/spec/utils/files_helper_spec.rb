# frozen_string_literal: true

require 'spec_helper'

RSpec.describe FilesHelper do
  describe '.directories_in' do
    let(:path) { 'spec/tmp/test_folder' }
    let(:test_folder) { SecureRandom.hex(10) }

    before do
      FileUtils.mkdir_p(path)
    end

    after do
      FileUtils.rm_rf(path)
    end

    context 'when the path exists' do
      let(:subfolders) { %w[subfolder1 subfolder2] }

      before do
        subfolders.each { |folder| FileUtils.mkdir_p(File.join(path, folder)) }
        FileUtils.touch(File.join(path, 'file.txt'))
      end

      it 'returns only the directories inside the path' do
        expect(described_class.directories_in(path)).to match_array(subfolders)
      end
    end

    context 'when the path does not exist' do
      let(:path) { 'spec/tmp/non_existent_folder' }

      it 'returns an empty array' do
        expect(described_class.directories_in(path)).to eq([])
      end
    end

    context 'when the path is empty' do
      it 'returns an empty array' do
        expect(described_class.directories_in(path)).to eq([])
      end
    end
  end

  describe '.files_in' do
    let(:path) { 'spec/tmp/test_folder' }

    before do
      FileUtils.mkdir_p(path)
    end

    after do
      FileUtils.rm_rf(path)
    end

    context 'when the path exists' do
      let(:files) { %w[file1.txt file2.jpg] }

      before do
        files.each { |file| FileUtils.touch(File.join(path, file)) }
        FileUtils.mkdir_p(File.join(path, 'subfolder')) # Add a folder to ensure only files are returned
      end

      it 'returns only the files inside the path' do
        expect(described_class.files_in(path)).to match_array(files)
      end
    end

    context 'when the path does not exist' do
      let(:path) { 'spec/tmp/non_existent_folder' }

      it 'returns an empty array' do
        expect(described_class.files_in(path)).to eq([])
      end
    end

    context 'when the path is empty' do
      it 'returns an empty array' do
        expect(described_class.files_in(path)).to eq([])
      end
    end
  end
end