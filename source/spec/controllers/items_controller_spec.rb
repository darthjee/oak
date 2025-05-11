# frozen_string_literal: true

require 'spec_helper'

RSpec.describe ItemsController, type: :controller do
  describe 'GET #index' do
    let(:category) { create(:oak_category) }
    let!(:items) { create_list(:oak_item, 3, category:) }

    context 'when format is JSON' do
      let(:expected) do
        Oak::Item::IndexDecorator.new(items).as_json
      end

      let(:parameters) { { category_slug: category.slug, format: :json } }

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
      let(:paramters) { { category_slug: category.slug, format: :html, ajax: true } }

      before do
        get :index, params: paramters, xhr: true
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
        get :index, params: { category_slug: category.slug }
      end

      it 'returns a redirect response' do
        expect(response).to have_http_status(:found) # HTTP status 302
      end

      it 'redirects to the correct path' do
        expect(response).to redirect_to("#/categories/#{category.slug}/items")
      end
    end
  end

  describe 'GET #show' do
    let(:category) { create(:oak_category) }
    let(:item) { create(:oak_item, category:) }

    context 'when format is JSON' do
      let(:expected) { Oak::Item::IndexDecorator.new(item).as_json }
      let(:params) { { category_slug: category.slug, id: item.id, format: :json } }

      before do
        get :show, params: params
      end

      it 'returns a successful response' do
        expect(response).to have_http_status(:ok)
      end

      it 'renders the correct JSON using the decorator' do
        expect(JSON.parse(response.body)).to eq(expected.stringify_keys)
      end
    end

    context 'when format is HTML' do
      let(:params) { { category_slug: category.slug, id: item.id } }
      
      before do
        get :show, params: params
      end

      it 'returns a successful response' do
        expect(response).to have_http_status(:ok)
      end

      it 'renders the correct template' do
        expect(response).to render_template(:show)
      end
    end
  end
end