# frozen_string_literal: true

class SubscriptionsController < ApplicationController
  include UserRequired

  protect_from_forgery except: :create
  require_user_for :create

  def create
    render json: subscription_json, status: status
  end

  private

  def subscription_json
    Oak::Subscription::Decorator.new(subscription).as_json
  end

  def subscription
    logged_user.subscriptions.find_or_create_by(category:)
  end

  def category
    @category ||= Oak::Category.find_by!(slug: params.require(:category_slug))
  end
end
