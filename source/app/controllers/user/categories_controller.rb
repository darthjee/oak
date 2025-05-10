# frozen_string_literal: true

class User::CategoriesController < ApplicationController
  include OnePageApplication

  protect_from_forgery except: %i[index]

  resource_for Oak::Category,
               only: :index,
               decorator: Oak::Category::MenuDecorator,
               paginated: false
end
