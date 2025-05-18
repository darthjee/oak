# frozen_string_literal: true

class CategoriesController < ApplicationController
  include OnePageApplication

  protect_from_forgery except: %i[index create]

  resource_for Oak::Category,
               only: :index,
               decorator: Oak::Category::Decorator,
               paginated: true,
               per_page: 20

  resource_for Oak::Category,
               only: %i[new create show],
               decorator: Oak::Category::Decorator,
               id_key: :slug,
               param_key: :slug,
               paginated: false

  private

  def categories
    @categories ||= Oak::Category.includes(:main_photo)
  end

  def category_params
    params.require(:category).permit(:name)
  end
end
