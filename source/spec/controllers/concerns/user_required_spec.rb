# frozen_string_literal: true

require 'spec_helper'

RSpec.describe UserRequired do
  controller(ApplicationController) do
    # rubocop:disable RSpec/DescribedClass
    include UserRequired
    # rubocop:enable RSpec/DescribedClass

    require_user_for :index

    def index
      render plain: 'ok'
    end
  end

  before do
    routes.draw { get 'index' => 'anonymous#index' }
  end

  describe '#redirect_if_unauthorized' do
    subject(:get_request) { get :index, params: parameters }

    let(:parameters) { { format: :html, ajax: true } }

    context 'when user is not logged in' do
      it 'redirects to forbidden' do
        get_request
        expect(response).to redirect_to('/#/forbidden')
      end

      it 'does not redirect to SPA root' do
        get_request
        expect(response.location).not_to include('/#/index')
      end
    end

    context 'when user is logged in' do
      let(:user)    { create(:user) }
      let(:session) { create(:session, user:) }

      before do
        cookies.signed[:session] = session.id
      end

      it 'does not redirect to forbidden' do
        get_request
        expect(response).to have_http_status(:ok)
      end
    end
  end
end
