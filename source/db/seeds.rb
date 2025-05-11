# frozen_string_literal: true

Zyra
  .register(User, find_by: :email)
  .on(:build) do |user|
    user.password = SecureRandom.hex(10)
  end

Zyra.register(Oak::Category, find_by: :name)

Zyra.find_or_create(
  :user,
  email: 'email@srv.com',
  login: 'user',
  name: 'user'
) { |u| u.password = '123456' }

%w[Arduino Pokemon Games Miniatures Packages Photos].each do |name|
  Zyra.find_or_create(:oak_category, name:)
end
