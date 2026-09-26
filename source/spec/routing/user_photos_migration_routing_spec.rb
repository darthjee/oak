# frozen_string_literal: true

require 'spec_helper'

RSpec.describe 'user photos migration routing' do
  it 'routes POST /user/photos/migration/prepare to user/photos/migrations#prepare' do
    expect(post: '/user/photos/migration/prepare').to route_to('user/photos/migrations#prepare')
  end

  it 'routes PATCH /user/photos/migration to user/photos/migrations#update' do
    expect(patch: '/user/photos/migration').to route_to('user/photos/migrations#update')
  end
end
