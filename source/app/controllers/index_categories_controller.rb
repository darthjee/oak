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
      logged_user ? relation : relation.where(id: Oak::Item.select(:category_id))
    end
  end
end
