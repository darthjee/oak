# Basic Usage

```ruby
class Order
  attr_reader :log

  def initialize
    @log = []
  end

  def validate
    log << 'validated'
  end

  def persist
    log << 'persisted'
  end

  def notify
    log << 'notified'
  end
end

registry = Jace::Registry.new
order    = Order.new

registry.register(:save, :before) { validate }
registry.register(:save)          { notify }

registry.trigger(:save, order) do
  order.persist   # main block uses the surrounding scope, so explicit receiver is needed
end

order.log
# => ['validated', 'persisted', 'notified']
```

---

[Back to hub](../jace-usage.md)
