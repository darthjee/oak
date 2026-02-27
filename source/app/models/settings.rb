# frozen_string_literal: true

class Sinclair
  module Settable
    class Caster
      cast_with(:seconds) { |value| value.to_i.seconds }
    end
  end
end

class Settings
  extend Sinclair::ChainSettable

  source :env, EnvSettings
  source :db,  ActiveSettings

  with_settings(:password_salt, :redirect_domain)
  setting_with_options(:hex_code_size, default: 16, type: :integer)
  setting_with_options(:session_period, default: 2.days, type: :seconds)
  setting_with_options(:cache_age, default: 1.seconds, type: :seconds)
  setting_with_options(:title, default: 'Oak')
  setting_with_options(:favicon, default: '/favicon.ico')
  setting_with_options(:photos_path, default: '/tmp/photos')

  setting_with_options(:photos_server_url, default: 'http://localhost:3001')
end
