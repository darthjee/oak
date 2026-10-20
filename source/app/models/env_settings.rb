# frozen_string_literal: true

class EnvSettings
  extend Sinclair::EnvSettable

  settings_prefix 'OAK'

  with_settings(
    :password_salt,
    :hex_code_size,
    :session_period,
    :long_session_period,
    :authorization_request_period,
    :authorization_request_create_limit,
    :authorization_request_create_window,
    :authorization_request_max_open,
    :cache_age,
    :title,
    :favicon,
    :photos_server_url,
    :photos_path
  )
end
