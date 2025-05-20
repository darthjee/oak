# frozen_string_literal: true

return if Rails.env.production? && ENV['FORCE_SEED'].nil?

require_relative 'seeds/registers'
require_relative 'seeds/user'
require_relative 'seeds/categories'

kind = Zyra.find_or_create(:oak_kind, name: 'Arduino')
ohter_kind = Zyra.find_or_create(:oak_kind, name: 'Component')
pokemon_kind = Zyra.find_or_create(:oak_kind, name: 'Normal')

Zyra.find_or_create(
  :oak_subscription,
  user_id: user.id,
  category_id: category.id
)

40.times do |i|
  %w[Games Miniatures Packages Photos].each do |prefix|
    name = "#{prefix} #{i}"
    Zyra.find_or_create(:oak_category, name:)
  end
end

item = Zyra.find_or_create(
  :oak_item,
  name: 'Arduino',
  user_id: user.id,
  category_id: category.id,
  kind_id: kind.id,
  description: 'An arduino'
)

(1..3).each do |i|
  Zyra.find_or_create(
    :oak_photo,
    file_name: "arduino#{i}.png",
    item_id: item.id
  )
end

Zyra.find_or_create(
  :oak_item,
  name: 'Wi-Fi',
  user_id: user.id,
  category_id: category.id,
  kind_id: ohter_kind.id,
  description: 'A Wi-Fi'
)

20.times do |i|
  Zyra.find_or_create(
    :oak_item,
    name: "Component #{i}",
    user_id: user.id,
    category_id: category.id,
    kind_id: ohter_kind.id,
    description: 'A Componente'
  )
end

100.times do |i|
  Zyra.find_or_create(
    :oak_item,
    name: "Poke #{i}",
    user_id: user.id,
    category_id: other_category.id,
    kind_id: pokemon_kind.id,
    description: 'A Pokemon'
  )
end
