# frozen_string_literal: true

class KindsController < ApplicationController
  include UserRequired

  protect_from_forgery except: %i[index create]
  require_user_for :new, :create

  resource_for Oak::Kind,
               only: :index,
               decorator: Oak::Kind::Decorator,
               paginated: true,
               per_page: 20

  resource_for Oak::Kind,
               only: %i[new create show],
               decorator: Oak::Kind::Decorator,
               id_key: :slug,
               param_key: :slug,
               paginated: false

  private

  def kinds
    @kinds ||= Oak::Kind.all.includes(:main_photo)
  end

  def kind_params
    params.require(:kind).permit(:name)
  end
end
