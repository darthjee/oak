# frozen_string_literal: true

require 'spec_helper'

RSpec.describe KindsController do
  let(:response_json) { response.parsed_body }

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
  end

  describe 'GET #new' do
    let(:session) { create(:session, user:) }
    let(:user) { create(:user) }

    before do
      cookies.signed[:session] = session.id if session
    end

    context 'when format is JSON' do
      let(:expected) do
        Oak::Kind::FormDecorator.new(Oak::Kind.new).as_json
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

      it 'includes empty categories' do
        expect(response_json['categories']).to eq([])
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
        expect(response).to redirect_to('/#/forbidden')
      end
    end
  end

  describe 'POST #create' do
    let(:kind_params) { { name: 'New Kind' } }
    let(:parameters) { { kind: kind_params, format: :json } }
    let(:created_kind) { Oak::Kind.last }
    let(:expected) { Oak::Kind::FormDecorator.new(created_kind).as_json }
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

    context 'when categories are provided' do
      let(:kind_params) do
        { name: 'New Kind', categories: [{ slug: 'category_1' }, { slug: 'unknown' }] }
      end

      before do
        create(:oak_category, name: 'Category 1')
        create(:oak_category, name: 'Category 2')
      end

      it 'creates a new Oak::Kind' do
        expect { post :create, params: parameters, as: :json }
          .to change(Oak::Kind, :count).by(1)
      end

      it 'links the known categories, ignoring unknown slugs' do
        post :create, params: parameters, as: :json

        expect(created_kind.categories.map(&:slug)).to contain_exactly('category_1')
      end

      it 'returns the created kind with its categories as JSON' do
        post :create, params: parameters, as: :json

        expect(response_json['categories'])
          .to eq([{ 'name' => 'Category 1', 'slug' => 'category_1' }])
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
        Oak::Kind::FormDecorator.new(expected_kind).tap(&:validate).as_json
      end

      it 'does not create a new Oak::Kind' do
        expect { post :create, params: parameters }
          .not_to change(Oak::Kind, :count)
      end

      it do
        post :create, params: parameters

        expect(response).to have_http_status(:unprocessable_content)
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
        expect(response).to redirect_to('/#/forbidden')
      end
    end
  end

  describe 'GET #show' do
    context 'when format is JSON' do
      let!(:kind) { create(:oak_kind) }
      let(:slug) { kind.slug }

      let(:expected) do
        Oak::Kind::FormDecorator.new(kind).as_json
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

    context 'when the kind has linked categories' do
      let!(:kind) { create(:oak_kind) }
      let!(:category) { create(:oak_category) }

      before do
        create(:oak_category_kind, category:, kind:)
        get :show, params: { format: :json, slug: kind.slug }
      end

      it 'includes the categories' do
        expect(response_json['categories'])
          .to eq([{ 'name' => category.name, 'slug' => category.slug }])
      end
    end
  end

  describe 'GET #edit' do
    let(:user) { create(:user) }
    let(:session) { create(:session, user:) }
    let(:kind) { create(:oak_kind) }

    before do
      cookies.signed[:session] = session.id if session
    end

    context 'when user is logged in' do
      context 'when format is JSON' do
        let(:expected) { Oak::Kind::FormDecorator.new(kind).as_json }

        before do
          get :edit, params: { slug: kind.slug, format: :json }
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
        get :edit, params: { slug: kind.slug }
      end

      it 'returns a redirect response' do
        expect(response).to have_http_status(:found) # HTTP status 302
      end

      it 'redirects to the correct path' do
        expect(response).to redirect_to('/#/forbidden')
      end
    end
  end

  describe 'PATCH #update' do
    let(:parameters) do
      { kind: kind_params, slug: kind.slug, format: :json }
    end
    let(:kind_params) { { name: 'Updated Name' } }
    let(:expected) { Oak::Kind::FormDecorator.new(kind.reload).as_json }
    let(:user) { create(:user) }
    let(:session) { create(:session, user:) }
    let(:kind) { create(:oak_kind, name: 'Old Name') }

    before do
      cookies.signed[:session] = session.id if session
    end

    context 'when the request is valid' do
      it 'updates the kind attributes' do
        patch :update, params: parameters

        expect(kind.reload.name).to eq('Updated Name')
      end

      it 'returns a successful response' do
        patch :update, params: parameters

        expect(response).to have_http_status(:ok)
      end

      it 'returns the updated kind as JSON' do
        patch :update, params: parameters

        expect(response_json).to eq(expected.stringify_keys)
      end
    end

    context 'when categories are synced' do
      let!(:kept_category) { create(:oak_category, name: 'Category 1') }
      let!(:removed_category) { create(:oak_category, name: 'Category 2') }
      let(:kind_params) do
        {
          name: 'Updated Name',
          categories: [{ slug: 'category_1' }, { slug: 'category_3' }, { slug: 'unknown' }]
        }
      end

      before do
        create(:oak_category, name: 'Category 3')
        create(:oak_category_kind, category: kept_category, kind:)
        create(:oak_category_kind, category: removed_category, kind:)
      end

      it 'syncs the linked categories, ignoring unknown slugs' do
        patch :update, params: parameters, as: :json

        expect(kind.reload.categories.map(&:slug))
          .to contain_exactly('category_1', 'category_3')
      end

      it 'returns the updated kind as JSON' do
        patch :update, params: parameters, as: :json

        expect(response_json).to eq(expected.stringify_keys)
      end
    end

    context 'when categories is an empty list' do
      let(:kind_params) { { name: 'Updated Name', categories: [] } }

      before do
        create(:oak_category_kind, kind:)
        create(:oak_category_kind, kind:)
      end

      it 'unlinks every category' do
        expect { patch :update, params: parameters, as: :json }
          .to change { kind.reload.categories.count }.from(2).to(0)
      end
    end

    context 'when categories key is not given' do
      let(:kind_params) { { name: 'Updated Name' } }

      before { create(:oak_category_kind, kind:) }

      it 'keeps the linked categories' do
        expect { patch :update, params: parameters, as: :json }
          .not_to(change { kind.reload.categories.to_a })
      end
    end

    context 'when the request is invalid' do
      let(:kind_params) { { name: '' } }
      let(:expected_kind) { Oak::Kind.new(kind_params) }
      let(:expected) do
        Oak::Kind::FormDecorator.new(expected_kind).tap(&:validate).as_json
      end

      it 'does not update the kind' do
        expect { patch :update, params: parameters }
          .not_to(change { kind.reload.attributes })
      end

      it 'returns an unprocessable entity response' do
        patch :update, params: parameters

        expect(response).to have_http_status(:unprocessable_content)
      end

      it 'returns the decorated kind as JSON' do
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
        expect(response).to redirect_to('/#/forbidden')
      end
    end
  end
end
