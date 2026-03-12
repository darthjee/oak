# frozen_string_literal: true

require 'spec_helper'

RSpec.describe IndexCategoriesController, type: :controller do
  let(:response_json) { JSON.parse(response.body) }

  describe 'GET #index' do
    context 'when format is JSON' do
      let!(:categories) { create_list(:oak_category, 3) }

      let(:expected) do
        categories.map do |category|
          Oak::Category::Decorator.new(category).as_json
        end
      end

      let(:parameters) { { ajax: true, format: :json } }

      context 'when user is logged in' do
        let(:user)    { create(:user) }
        let(:session) { create(:session, user:) }

        before { cookies.signed[:session] = session.id }

        context 'when there are categories without photo' do
          before { get :index, params: parameters }

          it 'returns a successful response' do
            expect(response).to have_http_status(:ok)
          end

          it 'returns all categories including empty ones' do
            expect(response_json).to eq(expected.map(&:stringify_keys))
          end
        end

        context 'when one category has photo' do
          let(:first_category) { categories.first }
          let(:second_category) { categories.second }
          let(:item) { create(:oak_item, category: first_category) }

          before do
            create(:oak_photo, item:)
            create(:oak_item, category: second_category)
            categories.each(&:reload)
            get :index, params: parameters
          end

          it 'returns a successful response' do
            expect(response).to have_http_status(:ok)
          end

          it 'renders the correct JSON using the decorator' do
            expect(response_json).to eq(expected.map(&:stringify_keys))
          end
        end
      end

      context 'when user is not logged in' do
        context 'when no categories have items' do
          before { get :index, params: parameters }

          it 'returns a successful response' do
            expect(response).to have_http_status(:ok)
          end

          it 'returns an empty list' do
            expect(response_json).to eq([])
          end
        end

        context 'when some categories have items' do
          let(:first_category)  { categories.first }
          let(:second_category) { categories.second }

          let(:expected_with_items) do
            [first_category, second_category].map do |category|
              Oak::Category::Decorator.new(category.reload).as_json
            end
          end

          before do
            create(:oak_item, category: first_category)
            create(:oak_item, category: second_category)
            get :index, params: parameters
          end

          it 'returns a successful response' do
            expect(response).to have_http_status(:ok)
          end

          it 'returns only categories that have items' do
            expect(response_json).to eq(expected_with_items.map(&:stringify_keys))
          end
        end
      end

      context 'when format is HTML and request is AJAX' do
        let(:parameters) { { format: :html, ajax: true } }

        before do
          get :index, params: parameters, xhr: true
        end

        it 'returns a successful response' do
          expect(response).to have_http_status(:ok)
        end

        it 'renders the correct template' do
          expect(response).to render_template(:index)
        end
      end

      context 'when format is HTML and request is not AJAX' do
        let(:parameters) { {} }

        before do
          get :index, params: parameters
        end

        it 'returns a redirect response' do
          expect(response).to have_http_status(:found) # HTTP status 302
        end

        it 'redirects to the correct path' do
          expect(response).to redirect_to('/#/categories')
        end
      end
    end
  end
end
