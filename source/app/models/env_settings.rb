# frozen_string_literal: true

class EnvSettings
  extend Sinclair::EnvSettable

  settings_prefix 'OAK'

  with_settings(
    :password_salt,
    :hex_code_size,
    :session_period,
    :cache_age,
    :title,
    :favicon,
    :photos_server_url,
    :photos_path
  )
end
