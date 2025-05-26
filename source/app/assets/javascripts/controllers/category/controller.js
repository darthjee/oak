(function(_, angular) {
  var app = angular.module("category/controller", [
    "cyberhawk/builder"
  ]);

  var SubscriptionsMethods = {
    subscribe: function(categorySlug) {
      console.info("Subscribing to category: " + categorySlug);
      var path = "/categories/" + categorySlug + "/subscriptions";
      var promise = this.requesterBuilder.build({
        path: path
      }).saveRequest({});

      promise.then(
        function(response) {
          this.constructor.trigger(this, "subscribe", "success", response.data);
        }.bind(this),
        function(response) {
          this.constructor.trigger(this, "subscribe", "error", response.data);
        }.bind(this)
      );
    }
  };

  var options = {
    callback: function() {
      _.extend(this, SubscriptionsMethods);

      _.bindAll(this, "subscribe");
    }
  };

  app.controller("Category.Controller", [
    "cyberhawk_builder", function(builder) {
      builder.buildAndRequest(this, options);
    }
  ]);
}(window._, window.angular));
