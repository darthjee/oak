# frozen_string_literal: true

require 'spec_helper'

RSpec.describe CategoriesController, type: :controller do
  describe 'GET #index' do
    let!(:categories) { create_list(:oak_category, 3) }

    context 'when format is JSON' do
      let(:expected) do
        Oak::Category::MenuDecorator.new(categories).as_json
      end

      let(:parameters) { { ajax: true, format: :json } }

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

    context 'when format is HTML and request is not AJAX' do
      before do
        get :index, params: { format: :html, ajax: true }, xhr: true
      end

      it 'returns a successful response' do
        expect(response).to have_http_status(:ok)
      end

      it 'renders the correct template' do
        expect(response).to render_template(:index)
      end
    end

    context 'when format is HTML and request is not AJAX' do
      before do
        get :index
      end

      it 'returns a redirect response' do
        expect(response).to have_http_status(:found) # HTTP status 302
      end

      it 'redirects to the correct path' do
        expect(response).to redirect_to('#/categories')
      end
    end
  end
end