# frozen_string_literal: true

class SubscriptionsController < ApplicationController
  include UserRequired

  protect_from_forgery except: :create
  require_user_for :create

  resource_for Oak::Subscription,
               only: :create,
               decorator: Oak::Subscription::Decorator

  private

  def subscription_params
    {
      user: logged_user,
      category: category
    }
  end

  def category
    @category ||= Oak::Category.find_by!(slug: params.require(:category_slug))
  end
end
