# frozen_string_literal: true

class CategoriesController < ApplicationController
  include UserRequired

  protect_from_forgery except: %i[index create]
  require_user_for :new, :create, :edit, :update

  resource_for Oak::Category,
               only: :index,
               decorator: Oak::Category::Decorator,
               paginated: true,
               per_page: 20

  resource_for Oak::Category,
               only: %i[new create show edit update],
               decorator: Oak::Category::FormDecorator,
               id_key: :slug,
               param_key: :slug,
               update_with: :update_category,
               paginated: false

  private

  def categories
    @categories ||= Oak::Category.includes(:main_photo)
  end

  def category_params
    params.require(:category).permit(:name, kinds: [])
  end

  def update_params
    category_params.to_h.symbolize_keys.merge(category:)
  end

  def update_category
    Oak::Category::UpdateBuilder.build(**update_params)
  end
end
