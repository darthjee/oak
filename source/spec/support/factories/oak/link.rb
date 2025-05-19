# frozen_string_literal: true

FactoryBot.define do
  factory :oak_link, class: 'Oak::Link' do
    association :item, factory: :oak_item

    url { "https://example#{SecureRandom.hex(4)}.com" }
    text { "Link #{SecureRandom.hex(2)}" }
    order { rand(-127..128) }
  end
end
