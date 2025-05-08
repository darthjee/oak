FactoryBot.define do
  factory :oak_photo, class: 'Oak::Photo' do
    association :item, factory: :oak_item
  end
end