# frozen_string_literal: true

require 'spec_helper'

RSpec.describe 'categories routing', type: :routing do
  it 'routes GET /categories to index_categories#index' do
    expect(get: '/categories').to route_to('index_categories#index')
  end

  it 'routes POST /categories to categories#create' do
    expect(post: '/categories').to route_to('categories#create')
  end

  it 'routes GET /categories/new to categories#new' do
    expect(get: '/categories/new').to route_to('categories#new')
  end

  it 'routes GET /categories/:slug to categories#show' do
    expect(get: '/categories/my-slug').to route_to('categories#show', slug: 'my-slug')
  end

  it 'routes GET /categories/:slug/edit to categories#edit' do
    expect(get: '/categories/my-slug/edit').to route_to('categories#edit', slug: 'my-slug')
  end

  it 'routes PATCH /categories/:slug to categories#update' do
    expect(patch: '/categories/my-slug').to route_to('categories#update', slug: 'my-slug')
  end
end
