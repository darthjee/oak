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
      var path = "/categories/" + categorySlug + "/subscriptions";
      var promise = this.requesterBuilder.build({
        path: path
      }).createRequest({});

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
      _.extend(this, KindMethods);
      _.bindAll(this, "requestKinds", "_setKinds", "_getKindsRequester", "_buildKindsRequester");

      this.requestKinds();

      _.bindAll(this, "subscribe");
    }
  };

  app.controller("Category.Controller", [
    "cyberhawk_builder", function(builder) {
      builder.buildAndRequest(this, options);
    }
  ]);
}(window._, window.angular));
