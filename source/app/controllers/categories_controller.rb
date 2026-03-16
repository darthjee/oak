# frozen_string_literal: true

class CategoriesController < ApplicationController
  include UserRequired

  protect_from_forgery except: :create
  require_user_for :new, :create, :edit, :update

  resource_for Oak::Category,
               only: %i[new create show edit update],
               decorator: Oak::Category::FormDecorator,
               id_key: :slug,
               param_key: :slug,
               build_with: :create_category,
               update_with: :update_category,
               paginated: false

  private

  def category
    return @category if defined?(@category)

    @category = Oak::Category.eager_load(:main_photo).find_by(slug: params[:slug])
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
