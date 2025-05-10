# frozen_string_literal: true

return if Rails.env.production? && ENV['FORCE_SEED'].nil?

Zyra
  .register(User, find_by: :email)
  .on(:build) do |user|
    return if user.encrypted_password.present?
    user.password = SecureRandom.hex(10)
  end

Zyra.register(Oak::Category, find_by: :slug)

user = Zyra.find_or_create(
  :user,
  email: 'email@srv.com',
  login: 'user',
  name: 'user',
) { |u| u.password = '123456' }
