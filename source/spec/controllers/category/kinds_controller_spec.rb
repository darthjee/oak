# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Category::KindsController, type: :controller do
  let(:response_json) { JSON.parse(response.body) }

  describe 'GET #index' do
    let(:category) { create(:oak_category) }
    let!(:kinds) { create_list(:oak_kind, 3) }

    before do
      kinds.each { |kind| create(:oak_category_kind, category:, kind:) }
    end

    context 'when format is JSON' do
      let(:parameters) { { category_slug: category.slug, format: :json } }
      let(:expected) do
        category.kinds.map { |kind| Oak::Kind::SelectDecorator.new(kind).as_json }
      end

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

    context 'when requesting for a category without kinds' do
      let(:empty_category) { create(:oak_category) }
      let(:parameters) { { category_slug: empty_category.slug, format: :json } }
      let(:expected) { [] }

      before do
        get :index, params: parameters
      end

      it 'returns a successful response' do
        expect(response).to have_http_status(:ok)
      end

      it 'renders an empty JSON array' do
        expect(response_json).to eq(expected)
      end
    end
  end
end
