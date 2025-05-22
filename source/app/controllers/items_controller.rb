# frozen_string_literal: true

class ItemsController < ApplicationController
  include UserRequired

  protect_from_forgery except: %i[index show create update]
  require_user_for :new, :create, :edit, :update

  resource_for Oak::Item,
               only: %i[index new create edit update],
               decorator: Oak::Item::Decorator,
               paginated: true,
               build_with: :build_item,
               update_with: :update_item

  resource_for Oak::Item,
               only: %i[show],
               decorator: Oak::Item::ShowDecorator

  model_for Oak::Category,
            id_key: :slug,
            param_key: :category_slug

  private

  def items
    @items ||= category.items.includes(:main_photo)
  end

  def kind
    @kind ||= Oak::Kind.find_by(slug: params.require(:item)[:kind_slug])
  end

  def item_params
    params
      .require(:item)
      .permit(:name, :description, links: %i[url text order])
      .merge(category:, kind:)
  end

  def build_item
    Oak::Item::CreateBuilder.build(**create_params)
  end

  def update_item
    Oak::Item::UpdateBuilder.build(**update_params)
  end

  def create_params
    item_params.to_h.symbolize_keys.merge(scope: logged_user.items)
  end

  def update_params
    item_params.to_h.symbolize_keys.merge(item:, user: item.user)
  end

  def category_slug
    params.require(:category_slug)
  end
end
