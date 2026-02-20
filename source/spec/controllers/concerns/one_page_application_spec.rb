# frozen_string_literal: true

require 'spec_helper'

RSpec.describe OnePageApplication, type: :controller do
  controller(ApplicationController) do
    def index
      render plain: 'ok'
    end
  end

  before do
    routes.draw { get 'index' => 'anonymous#index' }
  end

  describe '#render_root' do
    context 'without REDIRECT_DOMAIN env variable' do
      before do
        ENV.delete('REDIRECT_DOMAIN')
        get :index
      end

      it 'redirects to hash path' do
        expect(response).to redirect_to('#/index')
      end
    end

    context 'with REDIRECT_DOMAIN env variable' do
      before do
        ENV['REDIRECT_DOMAIN'] = 'https://example.com'
        get :index
      end

      after do
        ENV.delete('REDIRECT_DOMAIN')
      end

      it 'redirects to external domain with hash path' do
        expect(response).to redirect_to('https://example.com/#/index')
      end
    end

    context 'with REDIRECT_DOMAIN env variable with trailing slash' do
      before do
        ENV['REDIRECT_DOMAIN'] = 'https://example.com/'
        get :index
      end

      after do
        ENV.delete('REDIRECT_DOMAIN')
      end

      it 'redirects to external domain without double slash' do
        expect(response).to redirect_to('https://example.com/#/index')
      end
    end
  end
end
