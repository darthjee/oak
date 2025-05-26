(function(_, angular) {
  var app = angular.module("category/controller", [
    "cyberhawk/builder"
  ]);

  var KindMethods = {
    requestKinds: function() {
      var promise = this._getKindsRequester().request();
      promise.then(this._setKinds);

      this.constructor.trigger(this, this.route, "request");
    },

    _setKinds: function(response) {
      this.kinds = response.data;
      this.loaded = true;
      this.constructor.trigger(this, this.route, "loaded");
    },

    _getKindsRequester: function() {
      if ( !this.kindsRequester ) {
        this._buildKindsRequester();
      }

      return this.kindsRequester;
    },
    _buildKindsRequester: function() {
      this.kindsRequester = this.requesterBuilder.build({
        search: this.location.$$search,
        path: "/kinds"
      });
      this.kindsRequester.bind(this);
    }
  };

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
      _.extend(this, KindMethods);
      _.bindAll(this, "requestKinds", "_setKinds", "_getKindsRequester", "_buildKindsRequester");

      _.bindAll(this, "subscribe", "_getSubscriptionRequester");

      this.requestKinds();
    }
  };

  app.controller("Category.Controller", [
    "cyberhawk_builder", function(builder) {
      builder.buildAndRequest(this, options);
    }
  ]);
}(window._, window.angular));
