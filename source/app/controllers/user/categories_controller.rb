# frozen_string_literal: true

class User < ApplicationRecord
  class CategoriesController < ApplicationController
    include OnePageApplication
    include LoggedUser

    protect_from_forgery except: %i[index]

    resource_for Oak::Category,
                 only: :index,
                 decorator: Oak::Category::IndexDecorator,
                 paginated: true,
                 per_page: 5

    private

    def categories
      @categories ||= fetch_categories.eager_load(:main_photo)
    end

    def fetch_categories
      return Oak::Category.all unless logged_user

      logged_user.categories
    end
  end
end
