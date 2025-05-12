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

user = Zyra.find_or_create(
  :user,
  email: 'email@srv.com',
  login: 'user',
  name: 'user'
) { |u| u.password = '123456' }

category = Zyra.find_or_create(:oak_category, name: 'Arduino')
kind = Zyra.find_or_create(:oak_kind, name: 'Arduino')
ohter_kind = Zyra.find_or_create(:oak_kind, name: 'Component')

%w[Pokemon Games Miniatures Packages Photos].each do |name|
  Zyra.find_or_create(:oak_category, name:)
end

item = Zyra.find_or_create(
  :oak_item,
  name: 'Arduino',
  user_id: user.id,
  category_id: category.id,
  kind_id: kind.id
)

Zyra.find_or_create(
  :oak_photo,
  file_name: 'arduino.png',
  item_id: item.id
)

Zyra.find_or_create(
  :oak_item,
  name: 'Wi-Fi',
  user_id: user.id,
  category_id: category.id,
  kind_id: ohter_kind.id
)
