# frozen_string_literal: true

class CategoriesController < ApplicationController
  include OnePageApplication

  protect_from_forgery except: %i[index]

  resource_for Oak::Category,
               only: :index,
               decorator: Oak::Category::IndexDecorator,
               paginated: true,
               per_page: 20

  resource_for Oak::Category,
               only: %i[new create],
               decorator: Oak::Category::IndexDecorator,
               paginated: false
  private

  def categories
    @categories ||= Oak::Category.eager_load(:main_photo)
  end
end
