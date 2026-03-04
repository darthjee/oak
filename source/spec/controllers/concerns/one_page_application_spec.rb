# frozen_string_literal: true

require 'spec_helper'

RSpec.describe OnePageApplication, type: :controller do
  controller(ApplicationController) do
    # rubocop:disable RSpec/DescribedClass
    include OnePageApplication
    # rubocop:enable RSpec/DescribedClass

    def index
      render plain: 'ok'
    end
  end

  let(:redirect_domain) { 'example.com' }

  before do
    routes.draw { get 'index' => 'anonymous#index' }
  end

  describe '#render_root' do
    subject(:get_request) { get :index, params: parameters }

    before do
      request.headers['X-Forwarded-Host'] = redirect_domain
    end

    context 'without OAK_REDIRECT_DOMAIN env variable and with X-Forwarded-Host header' do
      before do
        allow(Settings).to receive(:redirect_domain).and_return(nil)
      end

      context 'with HTML format' do
        let(:parameters) { { format: :html } }

        it 'redirects to hash path without domain' do
          get_request
          expect(response).to redirect_to('/#/index.html')
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

    context 'with empty OAK_REDIRECT_DOMAIN env variable and with X-Forwarded-Host header' do
      before do
        allow(Settings).to receive(:redirect_domain).and_return('')
      end

      context 'with HTML format' do
        let(:parameters) { { format: :html } }

        it 'redirects to hash path without domain' do
          get_request
          expect(response).to redirect_to('/#/index.html')
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

    context 'with OAK_REDIRECT_DOMAIN env variable and with X-Forwarded-Host header' do
      before do
        allow(Settings).to receive(:redirect_domain).and_return(redirect_domain)
      end

      context 'with HTML format' do
        let(:parameters) { { format: :html } }

        it 'redirects to hash path with domain' do
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

    context 'with OAK_REDIRECT_DOMAIN env variable and without X-Forwarded-Host header' do
      let(:redirect_domain) { nil }

      before do
        allow(Settings).to receive(:redirect_domain).and_return('example.com')
      end

      context 'with HTML format' do
        let(:parameters) { { format: :html } }

        it 'redirects to hash path without domain' do
          get_request
          expect(response).to redirect_to('/#/index.html')
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
