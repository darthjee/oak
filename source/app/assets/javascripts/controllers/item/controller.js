(function(_, angular) {
  var app = angular.module("item/controller", [
    "cyberhawk/builder"
  ]);

  var LoginMethods = {
    login: function() {
      this.logged = true;
    },
    logoff: function() {
      this.logged = false;
    }
  }

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

  var CategoryMethods = {
    requestCategory: function() {
      var promise = this._getCategoryRequester().request();
      promise.then(this._setCategory);

      this.constructor.trigger(this, this.route, "request");
    },

    _setCategory: function(response) {
      this.category = response.data;
      this.loaded = true;
      this.constructor.trigger(this, this.route, "loaded");
    },

    _getCategoryRequester: function() {
      if (!this.categoryRequester) {
        this._buildCategoryRequester();
      }

      return this.categoryRequester;
    },

    _buildCategoryRequester: function() {
      var path = this.location.$$url.replace(/\/items$/, "");
      this.categoryRequester = this.requesterBuilder.build({
        search: this.location.$$search,
        path: path
      });
      this.categoryRequester.bind(this);
    }
  };

  var options = {
    callback: function(){
      _.extend(this, KindMethods);
      _.extend(this, CategoryMethods);
      _.extend(this, LoginMethods);
      _.bindAll(this, "requestKinds", "_setKinds", "_getKindsRequester", "_buildKindsRequester");
      _.bindAll(this, "requestCategory", "_setCategory", "_getCategoryRequester", "_buildCategoryRequester");
      _.bindAll(this, "login", "logoff");

      this.notifier.register("login-success", this.login);
      this.notifier.register("logged", this.login);
      this.notifier.register("logoff-success", this.logoff);

      this.requestKinds();
      this.requestCategory();
    }
  };

  app.controller("Item.Controller", [
    "cyberhawk_builder", function(builder) {
      builder.buildAndRequest(this, options);

    }
  ]);
}(window._, window.angular));
