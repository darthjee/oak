# frozen_string_literal: true

class CategoriesController < ApplicationController
  include OnePageApplication

  protect_from_forgery except: %i[index]

  resource_for Oak::Category,
                only: :index,
                decorator: Oak::Category::MenuDecorator,
                paginated: true,
                per_page: 20
end