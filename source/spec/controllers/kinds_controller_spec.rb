# frozen_string_literal: true

require 'spec_helper'

RSpec.describe KindsController, type: :controller do
  let(:response_json) { JSON.parse(response.body) }

  describe 'GET #index' do
    context 'when format is JSON' do
      let!(:kinds) { create_list(:oak_kind, 3) }

      let(:expected) do
        Oak::Kind::Decorator.new(kinds).as_json
      end

      let(:parameters) { { ajax: true, format: :json } }

      before do
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
        expect(response).to redirect_to('#/kinds')
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
        Oak::Kind::Decorator.new(Oak::Kind.new).as_json
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
    let(:kind_params) { { name: 'New Kind' } }
    let(:parameters) { { kind: kind_params, format: :json } }
    let(:created_kind) { Oak::Kind.last }
    let(:expected) { Oak::Kind::Decorator.new(created_kind).as_json }
    let(:session) { create(:session, user:) }
    let(:user) { create(:user) }

    before do
      cookies.signed[:session] = session.id if session
    end

    context 'when the request is valid' do
      it 'creates a new Oak::Kind' do
        expect { post :create, params: parameters }
          .to change(Oak::Kind, :count).by(1)
      end

      it do
        post :create, params: parameters

        expect(response).to have_http_status(:created)
      end

      it 'returns the created kind as JSON' do
        post :create, params: parameters

        expect(response_json).to eq(expected.stringify_keys)
      end
    end

    context 'when passing slug' do
      let(:kind_params) { { name: 'New Kind', slug: nil } }

      it 'creates a new Oak::Kind' do
        expect { post :create, params: parameters }
          .to change(Oak::Kind, :count).by(1)
      end

      it do
        post :create, params: parameters

        expect(response).to have_http_status(:created)
      end

      it 'returns the created kind as JSON' do
        post :create, params: parameters

        expect(response_json).to eq(expected.stringify_keys)
      end
    end

    context 'when the request is invalid' do
      let(:kind_params) { { name: '' } }
      let(:expected_kind) { Oak::Kind.new(kind_params) }
      let(:expected) do
        Oak::Kind::Decorator.new(expected_kind).tap(&:validate).as_json
      end

      it 'does not create a new Oak::Kind' do
        expect { post :create, params: parameters }
          .not_to change(Oak::Kind, :count)
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

  describe 'GET #show' do
    context 'when format is JSON' do
      let!(:kind) { create(:oak_kind) }
      let(:slug) { kind.slug }

      let(:expected) do
        Oak::Kind::Decorator.new(kind).as_json
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
        expect(response).to redirect_to("#/kinds/#{slug}")
      end
    end
  end
end
