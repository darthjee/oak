# frozen_string_literal: true

require 'spec_helper'

RSpec.describe OnePageApplication do
  controller(ApplicationController) do
    # rubocop:disable RSpec/DescribedClass
    include OnePageApplication
    # rubocop:enable RSpec/DescribedClass

    def index
      render plain: 'ok'
    end
  end

  before do
    routes.draw { get 'index' => 'anonymous#index' }
  end

  describe '#render_root' do
    subject(:get_request) { get :index, params: parameters }

    before do
      request.headers['X-Forwarded-Host'] = redirect_domain
    end

    context 'without X-Forwarded-Host header' do
      let(:redirect_domain) { nil }

      context 'with HTML format' do
        let(:parameters) { { format: :html } }

        it 'redirects to hash path for current domain' do
          get_request
          expect(response).to redirect_to('http://test.host/#/index.html')
        end
      end

      context 'with ajax html request' do
        let(:parameters) { { format: :html, ajax: true } }

        it 'does not redirect' do
          get_request
          expect(response).to have_http_status(:ok)
        end
      end

      context 'with json format' do
        let(:parameters) { { format: :json } }

        it 'does not redirect' do
          get_request
          expect(response).to have_http_status(:ok)
        end
      end
    end

    context 'with X-Forwarded-Host header' do
      let(:redirect_domain) { 'example.com' }

      context 'with HTML format' do
        let(:parameters) { { format: :html } }

        it 'redirects to hash path for other domain' do
          get_request
          expect(response).to redirect_to('http://example.com/#/index.html')
        end
      end

      context 'with ajax html request' do
        let(:parameters) { { format: :html, ajax: true } }

        it 'does not redirect' do
          get_request
          expect(response).to have_http_status(:ok)
        end
      end

      context 'with json format' do
        let(:parameters) { { format: :json } }

        it 'does not redirect' do
          get_request
          expect(response).to have_http_status(:ok)
        end
      end
    end

    context 'with empty X-Forwarded-Host header' do
      let(:redirect_domain) { '' }

      context 'with HTML format' do
        let(:parameters) { { format: :html } }

        it 'redirects to hash path for current domain' do
          get_request
          expect(response).to redirect_to('http://test.host/#/index.html')
        end
      end

      context 'with ajax html request' do
        let(:parameters) { { format: :html, ajax: true } }

        it 'does not redirect' do
          get_request
          expect(response).to have_http_status(:ok)
        end
      end

      context 'with json format' do
        let(:parameters) { { format: :json } }

        it 'does not redirect' do
          get_request
          expect(response).to have_http_status(:ok)
        end
      end
    end
  end
end
