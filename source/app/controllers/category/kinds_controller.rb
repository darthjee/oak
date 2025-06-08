# frozen_string_literal: true

module Category
  class KindsController < ApplicationController
    include UserRequired

    protect_from_forgery except: :index

    resource_for Oak::Kind,
                 only: :index,
                 decorator: Oak::Kind::SelectDecorator,
                 paginated: true

    model_for Oak::Category,
              id_key: :slug,
              param_key: :category_slug

    private

    def kinds
      @kinds ||= category.kinds
    end
  end
end
