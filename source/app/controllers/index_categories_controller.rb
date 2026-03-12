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
    @categories ||= begin
      relation = Oak::Category.eager_load(:main_photo)
      return relation if include_empty?

      relation.where(id: Oak::Item.visible_for(logged_user).select(:category_id))
    end
  end

  def include_empty?
    params.dig(:filters, :include_empty) == 'true'
  end
end
