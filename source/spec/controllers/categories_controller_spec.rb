# frozen_string_literal: true

require 'spec_helper'

RSpec.describe CategoriesController, type: :controller do
  let(:response_json) { JSON.parse(response.body) }

  describe 'GET #index' do
    context 'when format is JSON' do
      let!(:categories) { create_list(:oak_category, 3) }

      let(:expected) do
        Oak::Category::Decorator.new(categories).as_json
      end

      let(:parameters) { { ajax: true, format: :json } }

      before do
        get :index, params: parameters
      end

      context 'when there are categories without photo' do
        it 'returns a successful response' do
          expect(response).to have_http_status(:ok)
        end

        it 'renders the correct JSON using the decorator' do
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
        Oak::Category::Decorator.new(Oak::Category.new).as_json
      end

      before do
        get :new, params: { format: :json }
      end

      it 'returns an emppty json' do
        expect(response).to have_http_status(:ok)
      end

      it 'renders the correct JSON using the decorator' do
        expect(response_json).to eq(expected.stringify_keys)
      end
    end
  end

  describe 'POST #create' do
    let(:category_params) { { name: 'New Category' } }
    let(:parameters) { { category: category_params, format: :json } }
    let(:created_category) { Oak::Category.last }
    let(:expected) { Oak::Category::Decorator.new(created_category).as_json }

    context 'when the request is valid' do
      it 'creates a new Oak::Category' do
        expect { post :create, params: parameters }
          .to change(Oak::Category, :count).by(1)
      end

      it do
        post :create, params: parameters

        expect(response).to have_http_status(:created)
      end

      it 'returns the created category as JSON' do
        post :create, params: parameters

        expect(response_json).to eq(expected.stringify_keys)
      end
    end

    context 'when passing slug' do
      let(:category_params) { { name: 'New Category', slug: nil } }

      it 'creates a new Oak::Category' do
        expect { post :create, params: parameters }
          .to change(Oak::Category, :count).by(1)
      end

      it do
        post :create, params: parameters

        expect(response).to have_http_status(:created)
      end

      it 'returns the created category as JSON' do
        post :create, params: parameters

        expect(response_json).to eq(expected.stringify_keys)
      end
    end

    context 'when the request is invalid' do
      let(:category_params) { { name: '' } }
      let(:expected_category) { Oak::Category.new(category_params) }
      let(:expected) do
        Oak::Category::Decorator.new(expected_category).tap(&:validate).as_json
      end

      it 'does not create a new Oak::Category' do
        expect { post :create, params: parameters }
          .not_to change(Oak::Category, :count)
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

  describe 'GET #show' do
    context 'when format is JSON' do
      let!(:category) { create(:oak_category) }
      let(:slug) { category.slug }

      let(:expected) do
        Oak::Category::Decorator.new(category).as_json
      end

      let(:parameters) { { ajax: true, format: :json, slug: slug } }

      before do
        get :show, params: parameters
      end

      it 'returns a successful response' do
        expect(response).to have_http_status(:ok)
      end

      it 'renders the correct JSON using the decorator' do
        expect(response_json).to eq(expected.stringify_keys)
      end
    end

    context 'when format is HTML and request is AJAX' do
      let(:slug) { SecureRandom.hex(5) }
      let(:parameters) { { format: :html, ajax: true, slug: slug } }

      before do
        get :show, params: parameters, xhr: true
      end

      it 'returns a successful response' do
        expect(response).to have_http_status(:ok)
      end

      it 'renders the correct template' do
        expect(response).to render_template(:show)
      end
    end

    context 'when format is HTML and request is not AJAX' do
      let(:slug) { SecureRandom.hex(5) }
      let(:parameters) { { slug: slug } }

      before do
        get :show, params: parameters
      end

      it 'returns a redirect response' do
        expect(response).to have_http_status(:found) # HTTP status 302
      end

      it 'redirects to the correct path' do
        expect(response).to redirect_to("#/categories/#{slug}")
      end
    end
  end
end
