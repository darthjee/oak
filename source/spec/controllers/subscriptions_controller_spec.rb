# frozen_string_literal: true

require 'spec_helper'

RSpec.describe SubscriptionsController, type: :controller do
  let(:response_json) { JSON.parse(response.body) }
  let(:user) { create(:user) }
  let(:session) { create(:session, user:) }
  let(:category) { create(:oak_category, name: 'Sample Category') }
  let(:parameters) { { category_slug: category.slug, format: :json } }

  before do
    cookies.signed[:session] = session.id if session
  end

  describe 'POST #create' do
    context 'when the user is logged in' do
      it 'creates a new Oak::Subscription' do
        expect { post :create, params: parameters }
          .to change(Oak::Subscription, :count).by(1)
      end

      it 'returns a successful response' do
        post :create, params: parameters

        expect(response).to have_http_status(:created)
      end

      it 'returns the created subscription as JSON' do
        post :create, params: parameters

        created_subscription = Oak::Subscription.last
        expected = Oak::Subscription::Decorator.new(created_subscription).as_json

        expect(response_json).to eq(expected.stringify_keys)
      end
    end

    context 'when the user is not logged in' do
      let(:session) { nil }

      before do
        post :create, params: parameters
      end

      it 'returns a redirect response' do
        expect(response).to have_http_status(:found) # HTTP status 302
      end

      it 'redirects to the correct path' do
        expect(response).to redirect_to('#/forbidden')
      end
    end
  end
end