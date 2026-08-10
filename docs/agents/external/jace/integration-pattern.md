# Typical Integration Pattern

The most common pattern is to hold a `Jace::Registry` instance inside a service
or module and expose `register` to callers so they can hook into lifecycle events:

```ruby
module PaymentService
  REGISTRY = Jace::Registry.new

  def self.on(event, instant = :after, &block)
    REGISTRY.register(event, instant, &block)
  end

  def self.process(payment)
    REGISTRY.trigger(:payment_processed, payment) do
      payment.charge!
    end
  end
end

# In an initializer or plugin:
PaymentService.on(:payment_processed)          { send_receipt }
PaymentService.on(:payment_processed, :before) { log_attempt }

# Elsewhere in the application:
PaymentService.process(payment)
# Runs: log_attempt → payment.charge! → send_receipt
```

---

[Back to hub](../jace-usage.md)
