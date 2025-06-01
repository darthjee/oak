# frozen_string_literal: true

require 'spec_helper'

RSpec.describe CategoriesController, type: :controller do
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
  end

  describe 'GET #new' do
    let(:session) { create(:session, user:) }
    let(:user) { create(:user) }

    before do
      cookies.signed[:session] = session.id if session
    end

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
        Oak::Category::FormDecorator.new(Oak::Category.new).as_json
      end

      before do
        get :new, params: { format: :json }
      end

      it 'returns an empty JSON' do
        expect(response).to have_http_status(:ok)
      end

      it 'renders the correct JSON using the form decorator' do
        expect(response_json).to eq(expected.stringify_keys)
      end
    end

    context 'when user is not logged' do
      let(:session) { nil }

      before do
        get :new, params: { format: :json }
      end

      it 'returns a redirect response' do
        expect(response).to have_http_status(:found) # HTTP status 302
      end

      it 'redirects to the correct path' do
        expect(response).to redirect_to('#/forbidden')
      end
    end
  end

  describe 'POST #create' do
    let(:category_params) { { name: 'New Category', kinds: kinds_data } }
    let(:parameters) { { category: category_params, format: :json } }
    let(:created_category) { Oak::Category.last }
    let(:expected) { Oak::Category::FormDecorator.new(created_category).as_json }
    let(:session) { create(:session, user:) }
    let(:user) { create(:user) }
    let(:kinds_data) { [] }

    before do
      cookies.signed[:session] = session.id if session
    end

    context 'when the request is valid' do
      it 'creates a new Oak::Category' do
        expect { post :create, params: parameters }
          .to change(Oak::Category, :count).by(1)
      end

      it 'returns a successful response' do
        post :create, params: parameters

        expect(response).to have_http_status(:created)
      end

      it 'returns the created category as JSON' do
        post :create, params: parameters

        expect(response_json).to eq(expected.stringify_keys)
      end
    end

    context 'when kinds are provided' do
      let(:kinds_data) do
        [
          { name: 'Kind 1', slug: 'kind_1' },
          { name: 'Kind 2', slug: 'kind_2' }
        ]
      end

      before do
        create(:oak_kind, name: 'Kind 1')
        create(:oak_kind, name: 'Kind 2')
      end

      it 'creates a new Oak::Category' do
        expect { post :create, params: parameters }
          .to change(Oak::Category, :count).by(1)
      end

      it 'associates the kinds with the category' do
        post :create, params: parameters

        expect(created_category.kinds.map(&:slug)).to contain_exactly('kind_1', 'kind_2')
      end

      it 'does not change the count of Oak::Kind' do
        expect { post :create, params: parameters }
          .not_to change(Oak::Kind, :count)
      end

      it 'returns the created category as JSON' do
        post :create, params: parameters

        expect(response_json).to eq(expected.stringify_keys)
      end
    end

    context 'when the request is invalid' do
      let(:category_params) { { name: '', kinds: kinds_data } }
      let(:kinds_data) { [] }
      let(:expected_category) { Oak::Category.new(category_params) }
      let(:expected) do
        Oak::Category::FormDecorator.new(expected_category).tap(&:validate).as_json
      end

      it 'does not create a new Oak::Category' do
        expect { post :create, params: parameters }
          .not_to change(Oak::Category, :count)
      end

      it 'returns an unprocessable entity response' do
        post :create, params: parameters

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'returns errors as JSON' do
        post :create, params: parameters

        expect(response_json).to eq(expected.stringify_keys)
      end
    end

    context 'when user is not logged' do
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

  describe 'GET #edit' do
    let(:user) { create(:user) }
    let(:session) { create(:session, user:) }
    let(:category) { create(:oak_category) }

    before do
      cookies.signed[:session] = session.id if session
    end

    context 'when user is logged in' do
      context 'when format is HTML and it is not AJAX' do
        before do
          get :edit, params: { slug: category.slug }
        end

        it 'returns a redirect response' do
          expect(response).to have_http_status(:found) # HTTP status 302
        end

        it 'redirects to the correct path' do
          expect(response).to redirect_to("#/categories/#{category.slug}/edit")
        end
      end

      context 'when format is HTML and it is AJAX' do
        before do
          get :edit, params: { slug: category.slug, format: :html, ajax: true }, xhr: true
        end

        it 'returns a successful response' do
          expect(response).to have_http_status(:ok)
        end

        it 'renders the correct template' do
          expect(response).to render_template(:edit)
        end
      end

      context 'when format is JSON' do
        let(:expected) { Oak::Category::FormDecorator.new(category).as_json }

        before do
          get :edit, params: { slug: category.slug, format: :json }
        end

        it 'returns a successful response' do
          expect(response).to have_http_status(:ok)
        end

        it 'renders the correct JSON using the decorator' do
          expect(response_json).to eq(expected.stringify_keys)
        end
      end
    end

    context 'when user is not logged in' do
      let(:session) { nil }

      before do
        get :edit, params: { slug: category.slug }
      end

      it 'returns a redirect response' do
        expect(response).to have_http_status(:found) # HTTP status 302
      end

      it 'redirects to the correct path' do
        expect(response).to redirect_to('#/forbidden')
      end
    end
  end

  describe 'GET #show' do
    context 'when format is JSON' do
      let!(:category) { create(:oak_category) }
      let(:slug) { category.slug }

      let(:expected) do
        Oak::Category::FormDecorator.new(category).as_json
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

  describe 'PATCH #update' do
    let(:parameters) do
      { category: category_params, slug: category.slug, format: :json }
    end
    let(:category_params) { { name: 'Updated Name', kinds: kinds_data } }
    let(:kinds_data) { [] }
    let(:expected) { Oak::Category::FormDecorator.new(category.reload).as_json }
    let(:user) { create(:user) }
    let(:session) { create(:session, user:) }
    let(:category) { create(:oak_category, name: 'Old Name') }

    before do
      cookies.signed[:session] = session.id if session
    end

    context 'when the request is valid' do
      it 'updates the category attributes' do
        patch :update, params: parameters

        expect(category.reload.name).to eq('Updated Name')
      end

      it 'returns a successful response' do
        patch :update, params: parameters

        expect(response).to have_http_status(:ok)
      end

      it 'returns the updated category as JSON' do
        patch :update, params: parameters

        expect(response_json).to eq(expected.stringify_keys)
      end
    end

    context 'when kinds are provided' do
      let(:kinds_data) do
        [
          { name: 'Kind 1', slug: 'kind_1' },
          { name: 'Kind 2', slug: 'kind_2' }
        ]
      end

      before do
        create(:oak_kind, name: 'Kind 1')
        create(:oak_kind, name: 'Kind 2')
      end

      it 'updates the category kinds' do
        expect { patch :update, params: parameters }
          .to change { category.reload.kinds.count }.by(2)
      end

      it 'returns the updated category as JSON' do
        patch :update, params: parameters

        expect(response_json).to eq(expected.stringify_keys)
      end
    end

    context 'when the request is invalid' do
      let(:category_params) { { name: '' } }
      let(:expected_category) { Oak::Category.new(category_params) }
      let(:expected) do
        Oak::Category::FormDecorator.new(expected_category).tap(&:validate).as_json
      end

      it 'does not update the category' do
        expect { patch :update, params: parameters }
          .not_to(change { category.reload.attributes })
      end

      it 'returns an unprocessable entity response' do
        patch :update, params: parameters

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'returns errors as JSON' do
        patch :update, params: parameters

        expect(response_json).to eq(expected.stringify_keys)
      end
    end

    context 'when user is not logged in' do
      let(:session) { nil }

      before do
        patch :update, params: parameters
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
