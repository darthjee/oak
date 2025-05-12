# frozen_string_literal: true

class ItemsController < ApplicationController
  include OnePageApplication

  protect_from_forgery except: %i[index show]

  resource_for Oak::Item,
               only: %i[index show],
               decorator: Oak::Item::IndexDecorator,
               paginated: true
  
  private
end
