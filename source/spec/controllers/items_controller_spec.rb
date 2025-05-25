# frozen_string_literal: true

require 'spec_helper'

RSpec.describe ItemsController, type: :controller do
  let(:response_json) { JSON.parse(response.body) }
  let(:user) { create(:user) }
  let(:session) { create(:session, user:) }

  describe 'GET #index' do
    let(:category) { create(:oak_category) }
    let!(:items) { create_list(:oak_item, 3, category:) }

    context 'when format is JSON' do
      let(:expected) do
        Oak::Item::IndexDecorator.new(items).as_json
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
      let(:expected) { Oak::Item::ShowDecorator.new(item).as_json }
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
        Oak::Item::NewDecorator.new(Oak::Item.new(category:)).as_json
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
        expect(response).to redirect_to('#/forbidden')
      end
    end
  end

  describe 'POST #create' do
    let!(:kind) { create(:oak_kind) }
    let(:category) { create(:oak_category) }
    let(:item_params) do
      { name: 'New Item', kind_slug: kind.slug, description: 'desc', links: links_data }
    end
    let(:parameters) do
      { item: item_params, category_slug: category.slug, format: :json }
    end
    let(:created_item) { Oak::Item.last }
    let(:expected) { Oak::Item::NewDecorator.new(created_item).as_json }
    let(:links_data) { [] }

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

    context 'when payload contains links' do
      let(:links_data) do
        [
          { url: 'https://example.com/1', text: 'Example Link 1', order: 1 },
          { url: 'https://example.com/2', text: 'Example Link 2', order: 2 }
        ]
      end

      before do
        post :create, params: parameters
      end

      it 'creates a new Oak::Item' do
        expect { post :create, params: parameters }
          .to change(Oak::Item, :count).by(1)
      end

      it 'creates the associated links' do
        expect { post :create, params: parameters }
          .to change(Oak::Link, :count).by(2)
      end

      it 'associates the links with the created item' do
        expect(created_item.links.size).to eq(2)
      end

      it 'creates link from payload' do
        expect(created_item.links.map(&:url)).to contain_exactly('https://example.com/1', 'https://example.com/2')
      end

      it 'returns the created item with links as JSON' do
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
        Oak::Item::NewDecorator.new(expected_item.tap(&:validate)).as_json
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

    context 'when links are invalid' do
      let(:links_data) do
        [
          { url: nil, text: 'Invalid Link', order: 1 }, # Invalid link (missing URL)
          { url: 'https://example.com/2', text: nil, order: 2 } # Invalid link (missing text)
        ]
      end

      it 'does not create a new Oak::Item' do
        expect { post :create, params: parameters }
          .not_to change(Oak::Item, :count)
      end

      it 'does not create any links' do
        expect { post :create, params: parameters }
          .not_to change(Oak::Link, :count)
      end

      it 'returns unprocessable entity status' do
        post :create, params: parameters

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'returns validation errors as JSON' do
        post :create, params: parameters

        expect(response_json['errors']).to include('links' => ['is invalid'])
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
    let(:category) { create(:oak_category) }
    let(:item) { create(:oak_item, category:) }

    before do
      cookies.signed[:session] = session.id if session
    end

    context 'when user is logged in' do
      context 'when format is HTML and it is not AJAX' do
        before do
          get :edit, params: { category_slug: category.slug, id: item.id }
        end

        it 'returns a redirect response' do
          expect(response).to have_http_status(:found) # HTTP status 302
        end

        it 'redirects to the correct path' do
          expect(response).to redirect_to("#/categories/#{category.slug}/items/#{item.id}/edit")
        end
      end

      context 'when format is HTML and it is AJAX' do
        before do
          get :edit, params: { category_slug: category.slug, id: item.id, format: :html, ajax: true }, xhr: true
        end

        it 'returns a successful response' do
          expect(response).to have_http_status(:ok)
        end

        it 'renders the correct template' do
          expect(response).to render_template(:edit)
        end
      end

      context 'when format is JSON' do
        let(:expected) { Oak::Item::NewDecorator.new(item).as_json }

        before do
          get :edit, params: { category_slug: category.slug, id: item.id, format: :json }
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
        get :edit, params: { category_slug: category.slug, id: item.id }
      end

      it 'returns a redirect response' do
        expect(response).to have_http_status(:found) # HTTP status 302
      end

      it 'redirects to the correct path' do
        expect(response).to redirect_to('#/forbidden')
      end
    end
  end

  describe 'PUT #update' do
    let!(:kind) { create(:oak_kind) }
    let(:category) { create(:oak_category) }
    let(:item) { create(:oak_item, category:, kind:, user:) }
    let(:parameters) do
      { item: item_params, category_slug: category.slug, id: item.id, format: :json }
    end
    let(:session) { create(:session, user:) }
    let(:user) { create(:user) }
    let(:links_data) { [] }
    let(:item_params) do
      {
        name: 'Updated Item',
        description: 'Updated description',
        kind_slug: kind.slug,
        links: links_data
      }
    end

    before do
      cookies.signed[:session] = session.id if session
    end

    context 'when the request is valid' do
      it 'updates the Oak::Item attributes' do
        expect { put :update, params: parameters }
          .to change { item.reload.name }.to('Updated Item')
          .and change { item.reload.description }.to('Updated description')
      end

      it 'returns a successful response' do
        put :update, params: parameters

        expect(response).to have_http_status(:ok)
      end

      it 'returns the updated item as JSON' do
        put :update, params: parameters

        expected = Oak::Item::NewDecorator.new(item.reload).as_json
        expect(response_json).to eq(expected.stringify_keys)
      end
    end

    context 'when links are updated' do
      let!(:existing_link) { create(:oak_link, item:, url: 'https://example.com/old', text: 'Old Link') }
      let(:links_data) do
        [
          { id: existing_link.id, url: 'https://example.com/updated', text: 'Updated Link' },
          { url: 'https://example.com/new', text: 'New Link' }
        ]
      end

      it 'adds new link' do
        expect { put :update, params: parameters }
          .to change { item.links.count }.by(1)
      end

      it 'updates existing link' do
        expect { put :update, params: parameters }
          .to change { existing_link.reload.text }.to('Updated Link')
          .and change { existing_link.reload.url }.to('https://example.com/updated')
      end
    end

    context 'when links are deleted' do
      let(:links_data) { [] }

      before do
        create(:oak_link, item:, url: 'https://example.com/old', text: 'Old Link')
      end

      it 'removes all links from the item' do
        expect { put :update, params: parameters }
          .to change { item.links.count }.by(-1)
      end
    end

    context 'when links are invalid' do
      let(:links_data) do
        [
          { url: nil, text: 'Invalid Link' }, # Invalid link (missing URL)
          { url: 'https://example.com/2', text: nil } # Invalid link (missing text)
        ]
      end

      it 'does not update the Oak::Item' do
        expect { put :update, params: parameters }
          .not_to(change { item.reload.attributes })
      end

      it 'returns unprocessable entity status' do
        put :update, params: parameters

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'returns validation errors as JSON' do
        put :update, params: parameters

        expect(response_json['errors']).to include('links' => ['is invalid'])
      end
    end

    context 'when the request is invalid' do
      let(:item_params) do
        {
          name: '',
          description: '',
          kind_slug: kind.slug,
          links: links_data
        }
      end
      let(:expected_item_params) do
        { id: item.id, name: '', description: '', kind:, category:, user: }
      end
      let(:expected_item) { Oak::Item.new(expected_item_params) }

      it 'does not update the Oak::Item' do
        expect { put :update, params: parameters }
          .not_to(change { item.reload.attributes })
      end

      it 'returns unprocessable entity status' do
        put :update, params: parameters

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'returns validation errors as JSON' do
        put :update, params: parameters

        expected = Oak::Item::NewDecorator.new(expected_item.tap(&:validate)).as_json
        expect(response_json).to eq(expected)
      end
    end

    context 'when user is not logged' do
      let(:session) { nil }

      before do
        put :update, params: parameters
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
