# frozen_string_literal: true

return if Rails.env.production? && ENV['FORCE_SEED'].nil?

Zyra
  .register(User, find_by: :email)
  .on(:build) do |user|
    user.password = SecureRandom.hex(10)
  end

Zyra.register(Oak::Category, find_by: :name)
Zyra.register(Oak::Kind, find_by: :name)
Zyra.register(Oak::Item, find_by: %i[user_id category_id kind_id name])
Zyra.register(Oak::Photo, find_by: %i[item file_name])
Zyra.register(Oak::Link, find_by: %i[item_id url])
Zyra.register(Oak::Subscription, find_by: %i[user_id category_id])
Zyra.register(Oak::CategoryKind, find_by: %i[category_id kind_id])

user = Zyra.find_or_create(
  :user,
  email: 'email@srv.com',
  login: 'user',
  name: 'user'
)
user.password = '123456'
user.save

category = Zyra.find_or_create(:oak_category, name: 'Arduino')
other_category = Zyra.find_or_create(:oak_category, name: 'Pokemon')
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

  Zyra.find_or_create(
    :oak_link,
    text: "Link #{i}",
    url: "https://example.com/#{i}",
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

Oak::Item.all.distinct.pluck(:category_id, :kind_id).each do |(category_id, kind_id)|
  Zyra.find_or_create(:oak_categorykind, category_id: category_id, kind_id: kind_id)
end
