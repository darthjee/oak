# frozen_string_literal: true

class CategoriesController < ApplicationController
  include OnePageApplication

  protect_from_forgery except: %i[index]

  resource_for :category,
               only: :index
  resource_for :script,
               only: :index,
               decorator: Oak::Category::MenuDecorator,
               paginated: false
end