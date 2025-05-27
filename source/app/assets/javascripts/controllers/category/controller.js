(function(_, angular) {
  var app = angular.module("category/controller", [
    "cyberhawk/builder",
    "kind/methods"
  ]);

  var SubscriptionsMethods = {
    subscribe: function(categorySlug) {
      var requester = this._getSubscriptionRequester(categorySlug);
      requester.createRequest({});
    },

    _getSubscriptionRequester: function(categorySlug) {
      return this.requesterBuilder.build({
        path: "/categories/" + categorySlug + "/subscriptions"
      })
    }
  };

  var options = {
    callback: function() {
      _.extend(this, SubscriptionsMethods);

      _.bindAll(this, "subscribe", "_getSubscriptionRequester");
    }
  };

  app.controller("Category.Controller", [
    "cyberhawk_builder",
    "kinds_methods",
    function(builder, kindsMethods) {
      builder.buildAndRequest(this, options);
      kindsMethods.build(this);
    }
  ]);
}(window._, window.angular));
