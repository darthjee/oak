# frozen_string_literal: true

namespace :auth do
  resources :authorization_requests,
            path: 'authorization-requests', param: :uuid, only: :create
end
