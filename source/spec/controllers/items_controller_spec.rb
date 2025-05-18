# frozen_string_literal: true

require 'spec_helper'

RSpec.describe ItemsController, type: :controller do
  let(:response_json) { JSON.parse(response.body) }

  describe 'GET #index' do
    let(:category) { create(:oak_category) }
    let!(:items) { create_list(:oak_item, 3, category:) }

    context 'when format is JSON' do
      let(:expected) do
        Oak::Item::Decorator.new(items).as_json
      end

      context 'when requesting for the correct category' do
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

      context 'when requesting for the another category' do
        let(:other_category) { create(:oak_category) }
        let(:parameters) { { category_slug: other_category.slug, format: :json } }
        let(:expected) { [] }

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
    end

    context 'when format is HTML and request is AJAX' do
      let(:parameters) { { category_slug: category.slug, format: :html, ajax: true } }

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
      let(:parameters) { { category_slug: category.slug } }

      before do
        get :index, params: parameters
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
      let(:expected) { Oak::Item::Decorator.new(item).as_json }
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

    context 'when format is HTML and request is AJAX' do
      let(:params) do
        { category_slug: category.slug, id: item.id, ajax: true }
      end

      before do
        get :show, params: params, xhr: true
      end

      it 'returns a successful response' do
        expect(response).to have_http_status(:ok)
      end

      it 'renders the correct template' do
        expect(response).to render_template(:show)
      end
    end

    context 'when format is HTML and request is not AJAX' do
      let(:params) { { category_slug: category.slug, id: item.id } }

      before do
        get :show, params: params
      end

      it 'returns a redirect response' do
        expect(response).to have_http_status(:found) # HTTP status 302
      end

      it 'redirects to the correct path' do
        expect(response)
          .to redirect_to("#/categories/#{category.slug}/items/#{item.id}")
      end
    end
  end

  describe 'GET #new' do
    let(:category) { create(:oak_category) }
    let(:session) { create(:session, user:) }
    let(:user) { create(:user) }

    before do
      cookies.signed[:session] = session.id if session
    end

    context 'when format is HTML and it is not AJAX' do
      before do
        get :new, params: { category_slug: category.slug }
      end

      it 'returns a redirect response' do
        expect(response).to have_http_status(:found) # HTTP status 302
      end

      it 'redirects to the correct path' do
        expect(response).to redirect_to("#/categories/#{category.slug}/items/new")
      end
    end

    context 'when format is HTML and it is AJAX' do
      before do
        get :new, params: { category_slug: category.slug, format: :html, ajax: true }, xhr: true
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
        Oak::Item::Decorator.new(Oak::Item.new(category:)).as_json
      end

      before do
        get :new, params: { category_slug: category.slug, format: :json }
      end

      it 'returns an empty JSON' do
        expect(response).to have_http_status(:ok)
      end

      it 'renders the correct JSON using the decorator' do
        expect(response_json).to eq(expected.stringify_keys)
      end
    end

    context 'when user is not logged' do
      let(:session) { nil }

      before do
        get :new, params: { category_slug: category.slug }
      end

      it 'returns a redirect response' do
        expect(response).to have_http_status(:found) # HTTP status 302
      end

      it 'redirects to the correct path' do
        expect(response).to redirect_to("#/forbidden")
      end
    end
  end

  describe 'POST #create' do
    let!(:kind) { create(:oak_kind) }
    let(:category) { create(:oak_category) }
    let(:item_params) { { name: 'New Item', kind_slug: kind.slug } }
    let(:parameters) do
      { item: item_params, category_slug: category.slug, format: :json }
    end
    let(:created_item) { Oak::Item.last }
    let(:expected) { Oak::Item::Decorator.new(created_item).as_json }
    let(:session) { create(:session, user:) }
    let(:user) { create(:user) }

    before do
      cookies.signed[:session] = session.id if session
    end

    context 'when the request is valid' do
      it 'creates a new Oak::Item' do
        expect { post :create, params: parameters }
          .to change(Oak::Item, :count).by(1)
      end

      it do
        post :create, params: parameters

        expect(response).to have_http_status(:created)
      end

      it 'returns the created item as JSON' do
        post :create, params: parameters

        expect(response_json).to eq(expected.stringify_keys)
      end
    end

    context 'when the request is invalid' do
      let(:item_params) { { name: '', kind_slug: kind.slug } }
      let(:expected_item_params) do
        { name: '', kind:, category:, user: }
      end
      let(:expected_item) { Oak::Item.new(expected_item_params) }
      let(:expected) do
        Oak::Item::Decorator.new(expected_item.tap(&:validate)).as_json
      end

      it 'does not create a new Oak::Item' do
        expect { post :create, params: parameters }
          .not_to change(Oak::Item, :count)
      end

      it do
        post :create, params: parameters

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'returns errors as JSON' do
        post :create, params: parameters

        expect(response_json).to eq(expected.stringify_keys)
      end
    end
  end
end
