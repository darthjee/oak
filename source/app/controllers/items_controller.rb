# frozen_string_literal: true

class ItemsController < ApplicationController
  include OnePageApplication
  include LoggedUser

  protect_from_forgery except: %i[index show]

  resource_for Oak::Item,
               only: %i[index show new create],
               decorator: Oak::Item::IndexDecorator,
               paginated: true

  private

  def items
    @items ||= fetch_items
  end

  def fetch_items
    category.items
  end

  def category
    @category ||= Oak::Category.find_by(slug: params[:category_slug])
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
