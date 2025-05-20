# frozen_string_literal: true

user = Zyra.find_or_create(
  :user,
  email: 'email@srv.com',
  login: 'user',
  name: 'user'
)
user.password = '123456'
user.save