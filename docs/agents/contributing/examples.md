# Contributing Examples

Good/bad code snippets referenced by [git-workflow.md](git-workflow.md) and [code-style.md](code-style.md).

## Sandi Metz Rules

```ruby
# Good: each method does one thing
class Item
  def publish   = update!(status: :published)
  def unpublish = update!(status: :draft)
end

# Bad: method does too much
class Item
  def publish
    update!(status: :published)
    notify_subscribers
    expire_cache
    log_event
  end
end
```

## Method Order: Public Before Private

```ruby
# Good
class ItemPublisher
  def call
    publish
    notify
  end

  private

  def publish = item.update!(status: :published)
  def notify  = NotificationJob.perform_later(item)
end

# Bad: private methods mixed in with public ones
class ItemPublisher
  def call = publish

  private

  def publish = item.update!(status: :published)

  public

  def notify = NotificationJob.perform_later(item)
end
```

## Dependency Injection

```ruby
# Good: class receives its collaborator — easy to test
class ItemPublisher
  def initialize(item:, notifier: NotificationJob)
    @item = item
    @notifier = notifier
  end

  def call
    item.update!(status: :published)
    notifier.perform_later(item)
  end

  private

  attr_reader :item, :notifier
end

# Bad: class reaches out to load its own dependency — hard to test
class ItemPublisher
  def initialize(item)
    @item = item
  end

  def call
    item.update!(status: :published)
    NotificationJob.perform_later(item) # ❌ hardcoded dependency
  end
end
```

## Reducing Duplication

```ruby
# Good: shared lookup extracted
def category
  @category ||= Category.find_by!(slug: params[:category_slug])
end

# Bad: repeated in every action
def show
  category = Category.find_by!(slug: params[:category_slug])
  ...
end
```
