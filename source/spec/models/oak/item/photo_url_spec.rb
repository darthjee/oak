# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Oak::Item::PhotoUrl do
  subject(:photo_url) { described_class.call(item, type) }

  let(:item) { create(:oak_item, name:) }
  let(:name) { 'Sample Item' }
  let(:user) { item.user }
  let(:type) { %i[snap photo].sample }
  
  let(:expected) do
    [
      Settings.photos_server_url,
      user.id,
      type.to_s.pluralize,
      :items,
      item.category.slug,
      "#{item.id}.png"
    ].join("/")
  end

  describe '.call' do
    it 'includes the id and name' do
      expect(photo_url).to eq(expected)
    end
  end
end