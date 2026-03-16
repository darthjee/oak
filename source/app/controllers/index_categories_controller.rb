# frozen_string_literal: true

class IndexCategoriesController < ApplicationController
  include UserRequired

  protect_from_forgery except: :index

  resource_for Oak::Category,
               only: :index,
               decorator: Oak::Category::Decorator,
               paginated: true,
               per_page: 20

  private

  def categories
    @categories ||= fetch_categories
  end

  def fetch_categories
    return all_categories if include_empty?

    all_categories.where(id: Oak::Item.visible_for(logged_user).distinct.select(:category_id))
  end

  def all_categories
    Oak::Category.eager_load(:main_photo)
  end

  def include_empty?
    params.dig(:filters, :include_empty) == 'true'
  end
end
