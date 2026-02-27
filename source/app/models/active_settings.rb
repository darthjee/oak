# frozen_string_literal: true

class ActiveSettings
  extend ActiveSettable

  with_settings(
    :redirect_domain,
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
