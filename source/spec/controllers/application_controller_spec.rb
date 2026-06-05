# frozen_string_literal: true

require 'spec_helper'

describe ApplicationController do
  controller do
    def index
      render plain: 'ok'
    end
  end

  before do
    routes.draw { get 'index' => 'anonymous#index' }
  end

  describe 'X-Skip-Cache header' do
    subject(:get_request) { get :index }

    context 'when user is logged in (session cookie present)' do
      let(:user)    { create(:user) }
      let(:session) { create(:session, user:) }

      before do
        cookies.signed[:session] = session.id
      end

      it 'sets X-Skip-Cache header' do
        get_request
        expect(response.headers['X-Skip-Cache']).to eq('true')
      end
    end

    context 'when user is not logged in (no session cookie)' do
      it 'does not set X-Skip-Cache header' do
        get_request
        expect(response.headers['X-Skip-Cache']).to be_nil
      end
    end
  end
end
