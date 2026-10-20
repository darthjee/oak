# frozen_string_literal: true

require 'spec_helper'

RSpec.describe 'auth authorization requests routing' do
  it 'routes POST /auth/authorization-requests.json to auth/authorization_requests#create' do
    expect(post: '/auth/authorization-requests.json')
      .to route_to('auth/authorization_requests#create', format: 'json')
  end

  it 'routes POST /auth/authorization-requests/:uuid/poll.json to auth/authorization_requests#poll' do
    expect(post: '/auth/authorization-requests/some-uuid/poll.json')
      .to route_to('auth/authorization_requests#poll', uuid: 'some-uuid', format: 'json')
  end

  it 'routes POST /auth/authorization-requests/mine.json to the approvals controller' do
    expect(post: '/auth/authorization-requests/mine.json')
      .to route_to('auth/authorization_request_approvals#mine', format: 'json')
  end

  it 'routes POST /auth/authorization-requests/:uuid/authorize.json to the approvals controller' do
    expect(post: '/auth/authorization-requests/some-uuid/authorize.json')
      .to route_to('auth/authorization_request_approvals#authorize', uuid: 'some-uuid', format: 'json')
  end

  it 'routes POST /auth/authorization-requests/:uuid/deny.json to the approvals controller' do
    expect(post: '/auth/authorization-requests/some-uuid/deny.json')
      .to route_to('auth/authorization_request_approvals#deny', uuid: 'some-uuid', format: 'json')
  end
end
