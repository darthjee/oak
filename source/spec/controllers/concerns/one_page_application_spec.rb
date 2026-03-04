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

  before do
    routes.draw { get 'index' => 'anonymous#index' }
  end

  describe '#render_root' do
    subject(:get_request) { get :index, params: parameters }

    context 'without OAK_REDIRECT_DOMAIN env variable' do
      before do
        allow(Settings).to receive(:redirect_domain).and_return(nil)
      end

      context 'with HTML format' do
        let(:parameters) { { format: :html } }

        it 'redirects to hash path' do
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

    context 'with empty OAK_REDIRECT_DOMAIN env variable' do
      before do
        allow(Settings).to receive(:redirect_domain).and_return('')
      end

      context 'with HTML format' do
        let(:parameters) { { format: :html } }

        it 'redirects to hash path' do
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

    context 'with OAK_REDIRECT_DOMAIN env variable' do
      before do
        allow(Settings).to receive(:redirect_domain).and_return('example.com')
      end

      context 'with HTML format' do
        let(:parameters) { { format: :html } }

        it 'redirects to hash path' do
          get_request
          expect(response).to redirect_to('example.com/#/index.html')
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
