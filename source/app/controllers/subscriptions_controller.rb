# frozen_string_literal: true

class SubscriptionsController < ApplicationController
  include UserRequired

  protect_from_forgery except: :create
  require_user_for :create

  def create
    render json: serialized_subscription, status: subscription_status
  end

  private

  def serialized_subscription
    Oak::Subscription::Decorator.new(subscription).as_json
  end

  def subscription
    @subscription ||= find_or_initialize_subscription
  end

  def find_or_initialize_subscription
    logged_user.subscriptions.find_or_initialize_by(category: category).tap do |entity|
      @subscription_status = entity.persisted? ? :ok : :created
      entity.save if entity.new_record?
    end
  end

  attr_reader :subscription_status

  def category
    @category ||= Oak::Category.find_by!(slug: params.require(:category_slug))
  end
end
