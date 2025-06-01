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
               build_with: :create_category,
               update_with: :update_category,
               paginated: false

  private

  def categories
    @categories ||= Oak::Category.includes(:main_photo)
  end

  def category_params
    params.require(:category).permit(:name, kinds: [:slug])
  end

  def update_params
    category_params.to_h.deep_symbolize_keys.merge(category:)
  end

  def create_params
    category_params.to_h.deep_symbolize_keys.merge(scope: Oak::Category.all)
  end

  def update_category
    Oak::Category::UpdateBuilder.build(**update_params)
  end

  def create_category
    Oak::Category::CreateBuilder.build(**create_params)
  end
end
