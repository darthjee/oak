# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Photo::FileUrl do
  subject(:file_url) { described_class.call(photo, type) }

  let(:photo) { create(:oak_photo, item:, file_name:) }
  let(:item) { create(:oak_item, name:) }
  let(:name) { 'Sample Item' }
  let(:file_name) { 'example.jpg' }
  let(:user) { item.user }
  let(:type) { %i[snap photo].sample }

  let(:expected) do
    [
      Settings.photos_server_url,
      user.id,
      type.to_s.pluralize,
      :items,
      item.category.slug,
      item.id,
      file_name
    ].join('/')
  end

  describe '.call' do
    it 'returns the correct file URL' do
      expect(file_url).to eq(expected)
    end
  end
end