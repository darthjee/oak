# frozen_string_literal: true

class CategoriesController < ApplicationController
  include OnePageApplication

  protect_from_forgery except: %i[index show]

  resource_for Oak::Category,
                only: %i[index show]
                decorator: Oak::Category::MenuDecorator,
                paginated: true,
                per_page: 20
end