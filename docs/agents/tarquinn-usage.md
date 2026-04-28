# Tarquinn Usage Guide

Tarquinn is a Rails concern for managing controller redirections declaratively. It lets you
define redirection rules with conditions and skip rules directly in your controller classes.

## Basic Setup

Add Tarquinn to your `Gemfile` and run `bundle install`:

```ruby
gem 'tarquinn'
```

Include `Tarquinn` in your base controller:

```ruby
class ApplicationController < ActionController::Base
  include Tarquinn
end
```

## Core Features

### Redirection Rules

Use `redirection_rule` to declare a redirect. The first argument is both the rule name and
the name of the controller method that returns the redirect path. Additional arguments are
condition method names — the rule fires when **any** condition returns truthy.

```ruby
class BaseController < ApplicationController
  redirection_rule :redirect_login, :loggin_needed?

  private

  def redirect_login
    login_path
  end

  def loggin_needed?
    user.nil?
  end
end
```

### Skip Redirection Rules

Use `skip_redirection_rule` in a child controller to prevent a rule from firing when a
condition is truthy:

```ruby
class StaticController < BaseController
  skip_redirection_rule :redirect_login, :is_home?

  private

  def is_home?
    params[:action] == 'home'
  end
end
```

Use `skip_redirection` to bypass a rule for specific actions:

```ruby
class StaticController < BaseController
  skip_redirection :redirect_login, :index
end
```

### Block Syntax

Conditions can also be defined inline using a block:

```ruby
redirection_rule :redirect_login do
  user.nil?
end
```

## Advanced Features

### Cross-Domain Redirection

Use the `domain:` option to redirect to an external domain.

**Static domain (String):**

```ruby
class ExternalRedirectController < ApplicationController
  redirection_rule :redirect_external, domain: 'example.com' do
    params[:should_redirect]
  end

  private

  def redirect_external
    '/external_path'
  end
end
```

**Dynamic domain (Symbol):** the named method is called on the controller at request time to
resolve the domain:

```ruby
class ExternalRedirectController < ApplicationController
  redirection_rule :redirect_external, domain: :current_domain do
    params[:should_redirect]
  end

  private

  def redirect_external
    '/external_path'
  end

  def current_domain
    request.subdomain == 'admin' ? 'admin.example.com' : 'example.com'
  end
end
```

When `domain:` is not set, only same-host redirection is allowed.

## How It Works

1. Including `Tarquinn` automatically registers `before_action :perform_redirection`.
2. On each request, skip conditions are evaluated first — if any is truthy the rule is
   bypassed entirely.
3. Redirect conditions are then evaluated; the rule fires when any condition returns truthy.
4. Rules are evaluated in definition order; the **first** matching rule triggers the redirect.

## Best Practices

- Define redirection rules in base controllers so child controllers inherit them.
- Use `skip_redirection_rule` or `skip_redirection` in child controllers to override
  inherited rules.
- Keep redirect path methods private.
- Keep condition methods private and focused on a single responsibility.
- Name methods descriptively (e.g., `loggin_needed?`, `is_home?`).
- Use blocks for simple inline conditions.
- Use method symbols for conditions that are reused or need to be tested independently.

## Common Use Cases

- **Login redirects** — redirect unauthenticated users to the login page.
- **Authorization redirects** — redirect unauthorised users to an error or home page.
- **Onboarding flows** — guide new users through a setup wizard.
- **Feature flag redirects** — redirect users when a feature is disabled.
- **Subdomain-specific redirects** — route admin vs. public subdomains to different paths.
- **Maintenance mode** — redirect all traffic to a maintenance page when a flag is set.
