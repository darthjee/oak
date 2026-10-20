# frozen_string_literal: true

namespace :auth do
  resources :authorization_requests,
            path: 'authorization-requests', param: :uuid, only: :create do
    member { post :poll }
  end

  resources :authorization_requests,
            path: 'authorization-requests', param: :uuid, only: [],
            controller: 'authorization_request_approvals' do
    collection { post :mine }

    member do
      post :authorize
      post :deny
    end
  end
end
