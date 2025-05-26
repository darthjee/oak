# frozen_string_literal: true

Rails.application.routes.draw do
  get '/' => 'home#show', as: :home

  get '/forbidden' => 'static#forbidden', as: :forbidden

  resources :users, only: [:index] do
    collection do
      resources :login, only: [:create] do
        get '/' => :check, on: :collection
      end
      delete '/logoff' => 'login#logoff'
    end
  end

  namespace :admin do
    resources :users
  end

  namespace :user do
    resources :categories, only: :index
  end

  resources :categories, only: %i[index new create show], param: :slug do
    resources :items, only: %i[index show new create edit update]
    resources :subscriptions, only: %i[create]
  end

  resources :kinds, only: %i[index new create show], param: :slug
end
