# frozen_string_literal: true

class ItemsController < ApplicationController
  include OnePageApplication

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

  def category_slug
    params.require(:category_slug)
  end
end
