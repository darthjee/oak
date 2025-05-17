# frozen_string_literal: true

require 'spec_helper'

RSpec.describe User::CategoriesController, type: :controller do
  describe 'GET #index' do
    let!(:categories) { create_list(:oak_category, 3) }

    let(:expected) do
      Oak::Category::Decorator.new(categories).as_json
    end

    let(:parameters) { { ajax: true, format: :json } }

    context 'when user is not logged in' do
      before do
        get :index, params: parameters
      end

      it 'returns a successful response' do
        expect(response).to have_http_status(:ok)
      end

      it 'renders the correct JSON using the decorator' do
        expect(JSON.parse(response.body)).to eq(expected.map(&:stringify_keys))
      end
    end

    context 'when user is logged in' do
      let(:session) { create(:session, user: create(:user)) }
      let(:user) { session.user }

      before do
        controller.send(:cookies).signed[:session] = session.id
      end

      context 'when there is no subscription' do
        let(:expected) { [] }

        before do
          get :index, params: parameters
        end

        after do
          controller.send(:cookies).signed[:session] = nil
        end

        it 'returns a successful response' do
          expect(response).to have_http_status(:ok)
        end

        it 'renders the correct JSON using the decorator' do
          expect(JSON.parse(response.body)).to eq(expected.map(&:stringify_keys))
        end
      end

      context 'when there are subscriptions' do
        let!(:subscribed_categories) { create_list(:oak_category, 2) }

        let(:expected) do
          Oak::Category::Decorator.new(subscribed_categories).as_json
        end

        before do
          subscribed_categories.each do |category|
            create(:oak_subscription, user:, category:)
          end

          get :index, params: parameters
        end

        after do
          controller.send(:cookies).signed[:session] = nil
        end

        it 'returns a successful response' do
          expect(response).to have_http_status(:ok)
        end

        it 'renders the correct JSON using the decorator' do
          expect(JSON.parse(response.body)).to eq(expected.map(&:stringify_keys))
        end
      end
    end
  end
end
