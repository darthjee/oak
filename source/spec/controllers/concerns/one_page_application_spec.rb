# frozen_string_literal: true

require 'spec_helper'

RSpec.describe OnePageApplication, type: :controller do
  controller(ApplicationController) do
    include OnePageApplication
    def index
      render plain: 'ok'
    end
  end

  before do
    routes.draw { get 'index' => 'anonymous#index' }
  end

  describe '#render_root' do
    subject(:get_request) { get :index, params: parameters }

    context 'without REDIRECT_DOMAIN env variable' do
      before do
        ENV.delete('REDIRECT_DOMAIN')
      end

      context 'with HTML format' do
        let(:parameters) { { format: :html } }

        it 'redirects to hash path' do
          get_request
          expect(response).to redirect_to('#/index.html')
        end

        context "with ajax param" do
          let(:parameters) { { format: :html, ajax: true } }

          it 'does not redirect' do
            get_request
            expect(response).to have_http_status(:ok)
            expect(response.body).to eq('ok')
          end
        end
      end

      context "with json format" do
        let(:parameters) { { format: :json } }

        it 'does not redirect' do
          get_request
          expect(response).to have_http_status(:ok)
          expect(response.body).to eq('ok')
        end
      end
    end

    context 'with REDIRECT_DOMAIN env variable' do
      before do
        ENV['REDIRECT_DOMAIN'] = 'https://example.com'
      end

      context 'with HTML format' do
        let(:parameters) { { format: :html } }

        after do
          ENV.delete('REDIRECT_DOMAIN')
        end

        it 'redirects to external domain with hash path' do
          get_request
          expect(response).to redirect_to('https://example.com/#/index.html')
        end

        context "with ajax param" do
          let(:parameters) { { format: :html, ajax: true } }

          it 'does not redirect' do
            get_request
            expect(response).to have_http_status(:ok)
            expect(response.body).to eq('ok')
          end
        end
      end

      context "with json format" do
        let(:parameters) { { format: :json } }

        it 'does not redirect' do
          get_request
          expect(response).to have_http_status(:ok)
          expect(response.body).to eq('ok')
        end
      end
    end

    context 'with REDIRECT_DOMAIN env variable with trailing slash' do
      before do
        ENV['REDIRECT_DOMAIN'] = 'https://example.com/'
      end

      context 'with HTML format' do
        let(:parameters) { { format: :html } }

        after do
          ENV.delete('REDIRECT_DOMAIN')
        end

        it 'redirects to external domain without double slash' do
          get_request
          expect(response).to redirect_to('https://example.com/#/index.html')
        end

        context "with ajax param" do
          let(:parameters) { { format: :html, ajax: true } }

          it 'does not redirect' do
            get_request
            expect(response).to have_http_status(:ok)
            expect(response.body).to eq('ok')
          end
        end
      end

      context "with json format" do
        let(:parameters) { { format: :json } }

        it 'does not redirect' do
          get_request
          expect(response).to have_http_status(:ok)
          expect(response.body).to eq('ok')
        end
      end
    end
  end
end
