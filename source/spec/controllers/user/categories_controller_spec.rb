# frozen_string_literal: true

require 'spec_helper'

RSpec.describe User::CategoriesController, type: :controller do
  describe 'GET #index' do
    let!(:categories) { create_list(:oak_category, 3) }

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
end