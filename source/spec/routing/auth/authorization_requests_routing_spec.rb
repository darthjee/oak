# frozen_string_literal: true

require 'spec_helper'

RSpec.describe 'auth authorization requests routing' do
  it 'routes POST /auth/authorization-requests.json to auth/authorization_requests#create' do
    expect(post: '/auth/authorization-requests.json')
      .to route_to('auth/authorization_requests#create', format: 'json')
  end
end
