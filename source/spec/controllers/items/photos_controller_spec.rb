# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Items::PhotosController do
  let(:response_json) { response.parsed_body }
  let(:user) { create(:user) }
  let(:session) { create(:session, user:) }
  let(:category) { create(:oak_category) }
  let(:item) { create(:oak_item, category:, user:) }

  before do
    cookies.signed[:session] = session.id if session
  end

  describe 'POST #create' do
    let(:parameters) do
      { category_slug: category.slug, item_id: item.id, photo: { file_name: 'cat.jpg' }, format: :json }
    end

    context 'when the user owns the item' do
      it 'creates a new Oak::Photo' do
        expect { post :create, params: parameters }.to change(Oak::Photo, :count).by(1)
      end

      it 'returns a successful response' do
        post :create, params: parameters

        expect(response).to have_http_status(:created)
      end

      it 'creates the photo as not ready' do
        post :create, params: parameters

        expect(Oak::Photo.last.ready).to be(false)
      end

      it 'returns the photo without url fields' do
        post :create, params: parameters

        expect(response_json).to include(
          'id' => Oak::Photo.last.id,
          'ready' => false
        )
      end

      it 'returns a sanitized unique file_name' do
        post :create, params: parameters

        expect(response_json['file_name']).to match(/\Acat-[0-9a-f-]{36}\.jpg\z/)
      end
    end

    context 'when a photo with the same original file_name already exists on the item' do
      before { create(:oak_photo, item:, file_name: 'cat-existing-uuid.jpg') }

      it 'still creates a new Oak::Photo' do
        expect { post :create, params: parameters }.to change(Oak::Photo, :count).by(1)
      end

      it 'returns a successful response' do
        post :create, params: parameters

        expect(response).to have_http_status(:created)
      end
    end

    context 'when the user does not own the item' do
      let(:other_user) { create(:user) }
      let(:item) { create(:oak_item, category:, user: other_user) }

      it 'returns a forbidden response' do
        post :create, params: parameters

        expect(response).to have_http_status(:forbidden)
      end

      it 'does not create a photo' do
        expect { post :create, params: parameters }.not_to change(Oak::Photo, :count)
      end
    end

    context 'when the user is not logged in' do
      let(:session) { nil }

      it 'returns a redirect response' do
        post :create, params: parameters

        expect(response).to have_http_status(:found)
      end
    end
  end

  describe 'PATCH #update' do
    let(:photo) { create(:oak_photo, item:, ready: false) }
    let(:parameters) do
      { category_slug: category.slug, item_id: item.id, id: photo.id, status: status_param, format: :json }
    end

    context 'when status is "uploading"' do
      let(:status_param) { 'uploading' }

      context 'when the photo is not ready yet' do
        it 'returns a successful response' do
          patch :update, params: parameters

          expect(response).to have_http_status(:ok)
        end

        it 'returns the deterministic file path' do
          patch :update, params: parameters

          expect(response_json).to eq('file_path' => "users/#{user.id}/items/#{item.id}/#{photo.file_name}")
        end

        it 'does not mark the photo as ready' do
          expect { patch :update, params: parameters }.not_to(change { photo.reload.ready })
        end
      end

      context 'when the photo is already ready (replay guard)' do
        let(:photo) { create(:oak_photo, item:, ready: true) }

        it 'returns an unprocessable entity response' do
          patch :update, params: parameters

          expect(response).to have_http_status(:unprocessable_content)
        end
      end

      context 'when the user does not own the item' do
        let(:other_user) { create(:user) }
        let(:item) { create(:oak_item, category:, user: other_user) }

        it 'returns a forbidden response' do
          patch :update, params: parameters

          expect(response).to have_http_status(:forbidden)
        end
      end
    end

    context 'when status is "ready"' do
      let(:status_param) { 'ready' }

      it 'returns a successful response' do
        patch :update, params: parameters

        expect(response).to have_http_status(:ok)
      end

      it 'marks the photo as ready' do
        expect { patch :update, params: parameters }
          .to change { photo.reload.ready }.from(false).to(true)
      end
    end
  end
end
