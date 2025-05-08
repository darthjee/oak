FactoryBot.define do
  factory :oak_item, class: 'Oak::Item' do
    name { "Sample Item" }
    association :user
  end
end