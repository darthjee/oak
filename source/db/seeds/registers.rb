# frozen_string_literal: true

Zyra
  .register(User, find_by: :email)
  .on(:build) do |user|
    user.password = SecureRandom.hex(10)
  end

Zyra.register(Oak::Category, find_by: :name)
Zyra.register(Oak::Kind, find_by: :name)
Zyra.register(Oak::Item, find_by: %i[user_id category_id kind_id name])
Zyra.register(Oak::Photo, find_by: %i[item file_name])
Zyra.register(Oak::Subscription, find_by: %i[user_id category_id])