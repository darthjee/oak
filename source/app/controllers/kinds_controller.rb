# frozen_string_literal: true

class KindsController < ApplicationController
  include UserRequired

  protect_from_forgery except: %i[index create]
  require_user_for :new, :create, :edit, :update

  resource_for Oak::Kind,
               only: :index,
               decorator: Oak::Kind::Decorator,
               paginated: true,
               per_page: 20

  resource_for Oak::Kind,
               only: %i[new create show edit update],
               decorator: Oak::Kind::FormDecorator,
               id_key: :slug,
               param_key: :slug,
               build_with: :create_kind,
               update_with: :update_kind,
               paginated: false

  private

  def kinds
    @kinds ||= Oak::Kind.includes(:main_photo)
  end

  def kind_params
    params.require(:kind).permit(:name, categories: [:slug])
  end

  def create_params
    kind_params.to_h.deep_symbolize_keys.merge(scope: Oak::Kind.all)
  end

  def update_params
    kind_params.to_h.deep_symbolize_keys.merge(kind:)
  end

  def create_kind
    Oak::Kind::CreateBuilder.build(**create_params)
  end

  def update_kind
    Oak::Kind::UpdateBuilder.build(**update_params)
  end
end
