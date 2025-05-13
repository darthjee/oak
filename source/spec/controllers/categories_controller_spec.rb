# frozen_string_literal: true

require 'spec_helper'

RSpec.describe CategoriesController, type: :controller do
  describe 'GET #index' do
    context 'when format is JSON' do
      let!(:categories) { create_list(:oak_category, 3) }

      let(:expected) do
        Oak::Category::IndexDecorator.new(categories).as_json
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
        expect(response).to redirect_to('#/categories')
      end
    end
  end

  describe 'GET #new' do
    context 'when format is HTML and it is ajax' do
      before do
        get :new, params: { format: :html, ajax: true }, xhr: true
      end

      it 'returns a successful response' do
        expect(response).to have_http_status(:ok)
      end

      it 'renders the correct template' do
        expect(response).to render_template(:new)
      end
    end

    context 'when format is JSON' do
      let(:expected) do
        Oak::Category::IndexDecorator.new(Oak::Category.new).as_json
      end

      before do
        get :new, params: { format: :json }
      end

      it 'returns an emppty json' do
        expect(response).to have_http_status(:ok)
      end

      it 'renders the correct JSON using the decorator' do
        expect(JSON.parse(response.body)).to eq(expected.stringify_keys)
      end
    end
  end
end
