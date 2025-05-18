# frozen_string_literal: true

class ItemsController < ApplicationController
  include OnePageApplication
  include UserRequired

  protect_from_forgery except: %i[index show create]
  require_user_for :new

  resource_for Oak::Item,
               only: %i[index show new create],
               decorator: Oak::Item::Decorator,
               paginated: true

  model_for Oak::Category,
            id_key: :slug,
            param_key: :category_slug

  private

  def items
    @items ||= fetch_items
  end

  def fetch_items
    category.items.includes(:main_photo)
  end

  def kind
    @kind ||= Oak::Kind.find_by(slug: params.require(:item)[:kind_slug])
  end

  def item_params
    params
      .require(:item)
      .permit(:name)
      .merge(category:, kind:, user: logged_user)
  end

  def category_slug
    params.require(:category_slug)
  end
end
