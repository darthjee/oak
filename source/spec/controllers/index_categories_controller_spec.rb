# frozen_string_literal: true

require 'spec_helper'

RSpec.describe IndexCategoriesController, type: :controller do
  let(:response_json) { JSON.parse(response.body) }
  let(:parameters)    { { ajax: true, format: :json } }

  describe 'GET #index' do
    let!(:categories) { create_list(:oak_category, 3) }

    let(:expected) do
      categories.map do |category|
        Oak::Category::Decorator.new(category).as_json
      end
    end

    context 'when include_empty filter is true' do
      let(:parameters) { { ajax: true, format: :json, filters: { include_empty: 'true' } } }

      before { get :index, params: parameters }

      it 'returns a successful response' do
        expect(response).to have_http_status(:ok)
      end

      it 'returns all categories including empty ones' do
        expect(response_json).to eq(expected.map(&:stringify_keys))
      end
    end

    context 'when include_empty filter is not set' do
      context 'when user is logged in' do
        let(:user)    { create(:user) }
        let(:session) { create(:session, user:) }

        before { cookies.signed[:session] = session.id }

        context 'when no categories have items' do
          before { get :index, params: parameters }

          it 'returns a successful response' do
            expect(response).to have_http_status(:ok)
          end

          it 'returns an empty list' do
            expect(response_json).to eq([])
          end
        end

        context 'when categories have visible items' do
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

          it 'returns categories that have visible items' do
            expect(response_json).to eq(expected_with_items.map(&:stringify_keys))
          end
        end

        context 'when user has invisible items in a category' do
          let(:first_category) { categories.first }

          let(:expected_with_own_item) do
            [Oak::Category::Decorator.new(first_category.reload).as_json]
          end

          before do
            create(:oak_item, category: first_category, user:, visible: false)
            get :index, params: parameters
          end

          it 'returns a successful response' do
            expect(response).to have_http_status(:ok)
          end

          it 'returns the category containing the user\'s own invisible item' do
            expect(response_json).to eq(expected_with_own_item.map(&:stringify_keys))
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

        context 'when some categories have visible items' do
          let(:first_category)  { categories.first }
          let(:second_category) { categories.second }

          let(:expected_with_items) do
            [first_category, second_category].map do |category|
              Oak::Category::Decorator.new(category.reload).as_json
            end
          end

          before do
            create(:oak_item, category: first_category, visible: true)
            create(:oak_item, category: second_category, visible: true)
            get :index, params: parameters
          end

          it 'returns a successful response' do
            expect(response).to have_http_status(:ok)
          end

          it 'returns only categories that have visible items' do
            expect(response_json).to eq(expected_with_items.map(&:stringify_keys))
          end
        end

        context 'when categories only have invisible items' do
          let(:first_category) { categories.first }

          before do
            create(:oak_item, category: first_category, visible: false)
            get :index, params: parameters
          end

          it 'returns a successful response' do
            expect(response).to have_http_status(:ok)
          end

          it 'returns an empty list' do
            expect(response_json).to eq([])
          end
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
