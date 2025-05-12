# frozen_string_literal: true

FactoryBot.define do
  factory :oak_photo, class: 'Oak::Photo' do
    association :item, factory: :oak_item
    
    file_name { "photo_#{SecureRandom.hex(4)}.jpg" }
  end
end